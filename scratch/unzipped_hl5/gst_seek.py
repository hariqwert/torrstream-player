import sys
import gi
import os

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

Gst.init(None)

if len(sys.argv) < 5:
    print("Usage: python3 gst_seek.py <url> <mode> <start_time> <audio_track>")
    sys.exit(1)

url = sys.argv[1]
mode = sys.argv[2]
try:
    start_time = float(sys.argv[3])
except ValueError:
    start_time = 0.0
audio_track = sys.argv[4]

pipeline_str = f"uridecodebin uri={url} name=dec  dec. ! queue ! videoconvert ! x264enc tune=zerolatency speed-preset=ultrafast ! h264parse ! mp4mux name=mux streamable=true fragment-duration=1000 ! fdsink fd=1  dec. ! queue ! audioconvert ! audioresample ! voaacenc ! aacparse ! mux."

pipeline = Gst.parse_launch(pipeline_str)
loop = GLib.MainLoop()

did_seek = False

def on_message(bus, msg):
    global did_seek
    t = msg.type
    if t == Gst.MessageType.ERROR:
        err, debug = msg.parse_error()
        sys.stderr.write(f"Gst_seek Error: {err} {debug}\n")
        pipeline.set_state(Gst.State.NULL)
        loop.quit()
    elif t == Gst.MessageType.EOS:
        pipeline.set_state(Gst.State.NULL)
        loop.quit()
    elif t == Gst.MessageType.ASYNC_DONE:
        if start_time > 0 and not did_seek:
            sys.stderr.write(f"Gst_seek: Seeking to {start_time}s\n")
            flags = Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT
            seek_time = int(start_time * Gst.SECOND)
            pipeline.seek_simple(Gst.Format.TIME, flags, seek_time)
            did_seek = True

bus = pipeline.get_bus()
bus.add_signal_watch()
bus.connect("message", on_message)

pipeline.set_state(Gst.State.PLAYING)

try:
    loop.run()
except KeyboardInterrupt:
    pass
except Exception as e:
    sys.stderr.write(f"Gst_seek Exception: {str(e)}\n")

pipeline.set_state(Gst.State.NULL)

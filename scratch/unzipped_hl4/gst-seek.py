import sys
import gi
import os

gi.require_version('Gst', '1.0')
from gi.repository import Gst, GLib

Gst.init(None)

if len(sys.argv) < 3:
    print("Usage: python3 gst-seek.py <url> <start_time>")
    sys.exit(1)

url = sys.argv[1]
start_time = float(sys.argv[2])

# Write to fd=1 (stdout)
# We use fdsink to pipe out the transcoded stream.
pipeline_str = f"uridecodebin uri={url} name=dec  dec. ! queue ! videoconvert ! x264enc tune=zerolatency speed-preset=ultrafast ! h264parse ! mp4mux name=mux streamable=true fragment-duration=1000 ! fdsink fd=1  dec. ! queue ! audioconvert ! audioresample ! voaacenc ! aacparse ! mux."

pipeline = Gst.parse_launch(pipeline_str)

loop = GLib.MainLoop()

def on_message(bus, msg):
    t = msg.type
    if t == Gst.MessageType.ERROR:
        err, debug = msg.parse_error()
        sys.stderr.write(f"Error: {err} {debug}\n")
        pipeline.set_state(Gst.State.NULL)
        loop.quit()
    elif t == Gst.MessageType.EOS:
        pipeline.set_state(Gst.State.NULL)
        loop.quit()
    elif t == Gst.MessageType.ASYNC_DONE:
        if start_time > 0:
            # Perform the seek
            flags = Gst.SeekFlags.FLUSH | Gst.SeekFlags.KEY_UNIT
            seek_time = int(start_time * Gst.SECOND)
            pipeline.seek_simple(Gst.Format.TIME, flags, seek_time)
            # Prevent seeking again
            start_time_to_zero = 0

bus = pipeline.get_bus()
bus.add_signal_watch()
bus.connect("message", on_message)

pipeline.set_state(Gst.State.PLAYING)

try:
    loop.run()
except KeyboardInterrupt:
    pass

pipeline.set_state(Gst.State.NULL)

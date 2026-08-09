const html = `var _uc5=[91,91,21],_ov8=94,_es7=229,_hd2="",_xk7;`;
const regex = /var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/;
console.log(html.match(regex));

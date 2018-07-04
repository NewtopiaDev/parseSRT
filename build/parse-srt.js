(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.parseSRT = factory());
}(this, (function () { 'use strict';

function toSeconds(time) {
  var t = time.split(':');

  try {
    var s = t[2].split(',');

    if (s.length === 1) {
      s = t[2].split('.');
    }

    return parseFloat(t[0], 10) * 3600 + parseFloat(t[1], 10) * 60 + parseFloat(s[0], 10) + parseFloat(s[1], 10) / 1000;
  } catch (e) {
    return 0;
  }
}

function nextNonEmptyLine(linesArray, position) {
  var idx = position;

  while (!linesArray[idx]) {
    idx++;
  }

  return idx;
}

function lastNonEmptyLine(linesArray) {
  var idx = linesArray.length - 1;

  while (idx >= 0 && !linesArray[idx]) {
    idx--;
  }

  return idx;
}

function parseSRT() {
  var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { propName: {} };

  var subs = [];
  var lines = data.split(/(?:\r\n|\r|\n)/gm);
  var endIdx = lastNonEmptyLine(lines) + 1;
  var idx = 0;
  var time = void 0;
  var text = void 0;
  var sub = void 0;

  for (var i = 0; i < endIdx; i++) {
    sub = {};
    text = [];

    i = nextNonEmptyLine(lines, i);
    sub.id = parseInt(lines[i++], 10);

    time = lines[i++].split(/[\t ]*-->[\t ]*/);

    sub[options.propName.start || 'start'] = options.timeInText ? time[0] : toSeconds(time[0]);

    idx = time[1].indexOf(' ');
    if (idx !== -1) {
      time[1] = time[1].substr(0, idx);
    }
    sub[options.propName.end || 'end'] = options.timeInText ? time[1] : toSeconds(time[1]);

    while (i < endIdx && lines[i]) {
      text.push(lines[i++]);
    }

    var textPropName = options.propName.text || 'text';

    sub[textPropName] = text.join('\\N').replace(/\{(\\[\w]+\(?([\w\d]+,?)+\)?)+\}/gi, '');

    sub[textPropName] = sub[textPropName].replace(/</g, '&lt;').replace(/>/g, '&gt;');

    sub[textPropName] = sub[textPropName].replace(/&lt;(\/?(font|b|u|i|s))((\s+(\w|\w[\w\-]*\w)(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)(\/?)&gt;/gi, '<$1$3$7>');

    if (!options.ignoreLineBreaks) sub[textPropName] = sub[textPropName].replace(/\\N/gi, '<br />');else sub[textPropName] = sub[textPropName].replace(/\\N/gi, '');

    subs.push(sub);
  }

  return subs;
}

return parseSRT;

})));
//# sourceMappingURL=parse-srt.js.map

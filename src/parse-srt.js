'use strict'

/**
 * @name parseSRT
 * @desc Parses and converts SRT subtitle data into JSON format. Adapted from the popcorn.js SRT parser plugin.
 * @see http://github.com/NewtopiaDEV
 * @author Newtopia Dev (http://www.newtopia.com)
 * @version 1.0.1
 * @license MIT
 */

/**
 * @typedef {JSONSubtitle}
 * @property {Number} id - The subtitle ID number.
 * @property {Number} start - The start timestamp in seconds.
 * @property {Number} end - The end timestamp in seconds.
 * @property {String} text - The subtitle HTML.
 */

/**
 * @typedef {Options}
 * @property {Boolean} timeInText - Leave timestamp in text format.
 * @property {String=} propName.start - Prop name in response object for start.
 * @property {String=} propName.end - Prop name in response object for end.
 * @property {String=} propName.text - Prop name in response object for text.
 */

/**
 * Convert a HH:MM:SS,MMM or HH:MM:SS.MMM time format into seconds.
 *
 * @private
 * @param {String} time - The time to be converted.
 * @return {Number} - The time converted to seconds.
 */
function toSeconds (time) {
  const t = time.split(':')

  try {
    let s = t[2].split(',')

    // Just in case a . is decimal seperator
    if (s.length === 1) {
      s = t[2].split('.')
    }

    return parseFloat(t[0], 10) * 3600 + parseFloat(t[1], 10) * 60 + parseFloat(s[0], 10) + parseFloat(s[1], 10) / 1000
  } catch (e) {
    return 0
  }
}

/**
 * Get the next non empty line number.
 *
 * @private
 * @param {Array<String>} linesArray - All the lines.
 * @param {Number} position - The current line number.
 * @return {Number} - The number of the next non empty line.
 */
function nextNonEmptyLine (linesArray, position) {
  let idx = position

  while (!linesArray[idx]) {
    idx++
  }

  return idx
}

/**
 * Get the last non empty line number.
 *
 * @private
 * @param  {Array<String>} linesArray - All the lines.
 * @return {Number} - The number of the last non empty line.
 */
function lastNonEmptyLine (linesArray) {
  let idx = linesArray.length - 1

  while (idx >= 0 && !linesArray[idx]) {
    idx--
  }

  return idx
}

/**
 * Parses and converts SRT subtitle data into JSON format.
 *
 * @public
 * @param {String} data - The SRT file contents.
 * @param {Object} options - Options for the conversion.
 * @return {Array<JSONSubtitle>} - The subtitles in a JSON format.
 *
 * @example
 * var data = `1
 * 00:00:25,712 --> 00:00:30.399
 * This text is <font color="red">RED</font> and has not been {\pos(142,120)} positioned.
 * This takes \Nup three \nentire lines.
 * This contains nested <b>bold, <i>italic, <u>underline</u> and <s>strike-through</s></u></i></b> HTML tags
 * Unclosed but <b>supported tags are left in
 * <ggg>Unsupported</ggg> HTML tags are left in, even if <hhh>not closed.
 * SSA tags with {\i1} would open and close italicize {\i0}, but are stripped
 * Multiple {\pos(142,120)\b1}SSA tags are stripped`
 *
 * var subtitles = parseSRT(data)
 */
export default function parseSRT (data = '', options = { propName: {} }) {
  // declare needed variables and constants
  const subs = []
  const lines = data.split(/(?:\r\n|\r|\n)/gm)
  let endIdx = lastNonEmptyLine(lines) + 1
  let idx = 0
  let time
  let text
  let sub

  for (let i = 0; i < endIdx; i++) {
    sub = {}
    text = []

    i = nextNonEmptyLine(lines, i)
    sub.id = parseInt(lines[i++], 10)

    // Split on '-->' delimiter, trimming spaces as well
    time = lines[i++].split(/[\t ]*-->[\t ]*/)

    sub[options.propName.start || 'start'] = options.timeInText ? time[0] : toSeconds(time[0])

    // So as to trim positioning information from end
    idx = time[1].indexOf(' ')
    if (idx !== -1) {
      time[1] = time[1].substr(0, idx)
    }
    sub[options.propName.end || 'end'] = options.timeInText ? time[1] : toSeconds(time[1])

    // Build single line of text from multi-line subtitle in file
    while (i < endIdx && lines[i]) {
      text.push(lines[i++])
    }

    const textPropName = options.propName.text || 'text'
    // Join into 1 line, SSA-style linebreaks
    // Strip out other SSA-style tags
    sub[textPropName] = text.join(' ').replace(/\{(\\[\w]+\(?([\w\d]+,?)+\)?)+\}/gi, '')

    const x = 'asdf'

    // Escape HTML entities
    sub[textPropName] = sub[textPropName].replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Unescape great than and less than when it makes a valid html tag of a supported style (font, b, u, s, i)
    // Modified version of regex from Phil Haack's blog: http://haacked.com/archive/2004/10/25/usingregularexpressionstomatchhtml.aspx
    // Later modified by kev: http://kevin.deldycke.com/2007/03/ultimate-regular-expression-for-html-tag-parsing-with-php/
    sub[textPropName] = sub[textPropName].replace(/&lt;(\/?(font|b|u|i|s))((\s+(\w|\w[\w\-]*\w)(\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)(\/?)&gt;/gi, '<$1$3$7>')
    
    if (!options.ignoreLineBreaks) sub[textPropName] = sub[textPropName].replace(/\\N/gi, '<br />')
    else sub[textPropName] = sub[textPropName].replace(/\\N/gi, '')

    subs.push(sub)
  }

  return subs
}

/**
 * @license
 * Visual Blocks Language
 *
 * Copyright 2014 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating Rust for loop blocks.
 * @author luppy@appkaki.com (Lee Lup Yuen)
 */
'use strict';

goog.provide('Blockly.Rust.loops');

goog.require('Blockly.Rust');


Blockly.Rust['controls_repeat_ext'] = function(block) {
  // Repeat n times.
  if (block.getField('TIMES')) {
    // Internal number.
    var repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    var repeats = Blockly.Rust.valueToCode(block, 'TIMES',
        Blockly.Rust.ORDER_ASSIGNMENT) || '0';
  }
  var branch = Blockly.Rust.statementToCode(block, 'DO');
  branch = Blockly.Rust.addLoopTrap(branch, block.id);
  var code = '';
  var loopVar = Blockly.Rust.variableDB_.getDistinctName(
      'count', Blockly.Variables.NAME_TYPE);
  var endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.isNumber(repeats)) {
    var endVar = Blockly.Rust.variableDB_.getDistinctName(
        'repeat_end', Blockly.Variables.NAME_TYPE);
    code += 'var ' + endVar + ' = ' + repeats + ';\n';
  }
  code += 'for ' + loopVar + ' in 0..' + endVar + ' {\n' +
      branch + '}\n';
  return code;
};

Blockly.Rust['controls_repeat'] = Blockly.Rust['controls_repeat_ext'];

Blockly.Rust['controls_whileUntil'] = function(block) {
  // Do while/until loop.
  var until = block.getFieldValue('MODE') == 'UNTIL';
  var argument0 = Blockly.Rust.valueToCode(block, 'BOOL',
      until ? Blockly.Rust.ORDER_UNARY_PREFIX :
      Blockly.Rust.ORDER_NONE) || 'false';
  var branch = Blockly.Rust.statementToCode(block, 'DO');
  branch = Blockly.Rust.addLoopTrap(branch, block.id);
  if (until) {
    argument0 = '!' + argument0;
  }
  return 'while ' + argument0 + ' {\n' + branch + '}\n';
};

Blockly.Rust['controls_for'] = function(block) {
  // For loop.
  var variable0 = Blockly.Rust.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Rust.valueToCode(block, 'FROM',
      Blockly.Rust.ORDER_ASSIGNMENT) || '0';
  var argument1 = Blockly.Rust.valueToCode(block, 'TO',
      Blockly.Rust.ORDER_ASSIGNMENT) || '0';
  var increment = Blockly.Rust.valueToCode(block, 'BY',
      Blockly.Rust.ORDER_ASSIGNMENT) || '1';
  var branch = Blockly.Rust.statementToCode(block, 'DO');
  branch = Blockly.Rust.addLoopTrap(branch, block.id);
  var code;
  if (Blockly.isNumber(argument0) && Blockly.isNumber(argument1) &&
      Blockly.isNumber(increment)) {
    // All arguments are simple numbers.
    var up = parseFloat(argument0) <= parseFloat(argument1);
    code = 'for ' + variable0 + ' in ' + argument0 + ' .. ' +
        argument1;
    /* TODO:
    var step = Math.abs(parseFloat(increment));
    if (step == 1) {
      code += up ? '++' : '--';
    } else {
      code += (up ? ' += ' : ' -= ') + step;
    }
    */
    code += ' {\n' + branch + '}\n';
  } else {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    var startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.isNumber(argument0)) {
      var startVar = Blockly.Rust.variableDB_.getDistinctName(
          variable0 + '_start', Blockly.Variables.NAME_TYPE);
      code += 'var ' + startVar + ' = ' + argument0 + ';\n';
    }
    var endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.isNumber(argument1)) {
      var endVar = Blockly.Rust.variableDB_.getDistinctName(
          variable0 + '_end', Blockly.Variables.NAME_TYPE);
      code += 'var ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    var incVar = Blockly.Rust.variableDB_.getDistinctName(
        variable0 + '_inc', Blockly.Variables.NAME_TYPE);
    code += 'num ' + incVar + ' = ';
    if (Blockly.isNumber(increment)) {
      code += Math.abs(increment) + ';\n';
    } else {
      code += '(' + increment + ').abs();\n';
    }
    code += 'if ' + startVar + ' > ' + endVar + ' {\n';
    code += Blockly.Rust.INDENT + incVar + ' = -' + incVar + ';\n';
    code += '}\n';
    code += 'for ' + variable0 + ' in ' + startVar + ' .. ' +
        endVar + ' {\n' +
        branch + '}\n';
  }
  return code;
};

Blockly.Rust['controls_forEach'] = function(block) {
  // For each loop.
  var variable0 = Blockly.Rust.variableDB_.getName(
      block.getFieldValue('VAR'), Blockly.Variables.NAME_TYPE);
  var argument0 = Blockly.Rust.valueToCode(block, 'LIST',
      Blockly.Rust.ORDER_ASSIGNMENT) || '[]';
  var branch = Blockly.Rust.statementToCode(block, 'DO');
  branch = Blockly.Rust.addLoopTrap(branch, block.id);
  var code = 'for ' + variable0 + ' in ' + argument0 + ' {\n' +
      branch + '}\n';
  return code;
};

Blockly.Rust['controls_flow_statements'] = function(block) {
  // Flow statements: continue, break.
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return 'break;\n';
    case 'CONTINUE':
      return 'continue;\n';
  }
  throw Error('Unknown flow statement.');
};

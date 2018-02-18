#! /usr/bin/env node
'use strict';

/*
 * Copyright 2018 Dennis Pagano
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const glob = require('glob');
const ArgumentParser = require('argparse').ArgumentParser;
const merger = require('../src/closure-coverage-merger.js');

const inputFileNames = [];

readArguments();
merger.mergeCoverage(inputFileNames);

/** Reads and interprets the command line arguments. */
function readArguments() {
	const parser = new ArgumentParser({version: '1.0.2', addHelp:true, description: 'Coverage merger for the Google Closure Compiler. Merges multiple coverage objects stored in JSON files and outputs them as a single JSON or LCOV report.'});
	parser.addArgument(['-o', '--output' ], {help: 'Name of the output file. Defaults to ' + merger.outputFile});
	parser.addArgument(['-i', '--input' ], {help: 'Input files containing the coverage objects', required: true, nargs: '+'});
	parser.addArgument(['-x', '--excludes' ], {help: 'Exclude coverage for specific filenames. Coverage will not be processed for files whose filename contains one of these strings. Defaults to ' + JSON.stringify(merger.excludes)});
	parser.addArgument(['-e', '--encoding' ], {help: 'Encoding to use when reading coverage files. Defaults to ' + merger.encoding});
	parser.addArgument(['-f', '--format' ], {help: 'Format of the created report. Defaults to ' + merger.format, choices: ['lcov', 'json']});
	const args = parser.parseArgs();

	merger.outputFile = args.output || merger.outputFile;
	merger.excludes = args.excludes || merger.excludes;
	merger.encoding = args.encoding || merger.encoding;
	merger.format = args.format || merger.format;

	args.input.forEach(function (input) {
		const results = glob.sync(input, {mark: true, nosort: true, strict: true});
		inputFileNames.push.apply(inputFileNames, results);
	});
}

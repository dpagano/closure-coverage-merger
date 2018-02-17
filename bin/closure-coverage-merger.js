#! /usr/bin/env node
'use strict';

/*
 * Copyright [2018] [Dennis Pagano]
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

const fs = require('fs');
const glob = require('glob');
const ArgumentParser = require('argparse').ArgumentParser;

let mergedCoverage = {};
let excludes = ['closure-library:', 'generated', 'soyutils_usegoog'];
let encoding = 'utf8';
let outputFile = 'output.lcov';
let inputFileNames = [];
let format = 'lcov';

readArguments();
parseFiles();
saveCoverage();

/** Reads and interprets the command line arguments. */
function readArguments() {
	var parser = new ArgumentParser({version: '1.0.2', addHelp:true, description: 'Coverage merger for the Google Closure Compiler. Merges multiple coverage objects stored in JSON files and outputs them as a single JSON or LCOV report.'});
	parser.addArgument(['-o', '--output' ], {help: 'Name of the output file. Defaults to ' + outputFile});
	parser.addArgument(['-i', '--input' ], {help: 'Input files containing the coverage objects', required: true, nargs: '+'});
	parser.addArgument(['-x', '--excludes' ], {help: 'Exclude coverage for specific filenames. Coverage will not be processed for files whose filename contains one of these strings. Defaults to ' + JSON.stringify(excludes)});
	parser.addArgument(['-e', '--encoding' ], {help: 'Encoding to use when reading coverage files. Defaults to ' + encoding});
	parser.addArgument(['-f', '--format' ], {help: 'Format of the created report. Defaults to ' + format, choices: ['lcov', 'json']});
	let args = parser.parseArgs();

	outputFile = args.output || outputFile;
	excludes = args.excludes || excludes;
	encoding = args.encoding || encoding;
	format = args.format || format;

	args.input.forEach(function (input) {
		let results = glob.sync(input, {mark: true, nosort: true, strict: true});
		inputFileNames.push.apply(inputFileNames, results);
	});
}

/** Parses the input files. */
function parseFiles() {
	inputFileNames.forEach(fileName => {
		let coverage = JSON.parse(fs.readFileSync(fileName, encoding));
		checkCoverage(fileName, coverage);
		parseCoverage(coverage);
	});
	cleanupMergedCoverage();
	console.log('Generated coverage for ' + Object.keys(mergedCoverage).length + ' files.');
}

/** Basic checks for the structure of the provided coverage. */
function checkCoverage(inputFileName, coverage) {
	if (coverage.executedLines === undefined || coverage.instrumentedLines === undefined || coverage.fileNames === undefined) {
		error('Wrong format of coverage in ' + inputFileName);
	}
	if (coverage.executedLines.length !== coverage.fileNames.length) {
		error('Number of files and number of lines do not match in ' + inputFileName);
	}
}

/** Parses the provided coverage object. */
function parseCoverage(coverage) {
	for (let i = 0; i < coverage.fileNames.length; ++i) {
		let fileName = coverage.fileNames[i];

		if (!shouldParse(fileName)) {
			continue;
		}

		let execution = coverage.executedLines[i];
		let coveredLines = [];

		for (let line = 0; line < execution.length; ++line) {
			if (execution[line]) {
				// Lines are 0-based. We output them 1-based.
				coveredLines.push(line + 1);
			}
		}

		setOrMergeCoverage(fileName, coveredLines);
	}
}

/** Determines whether coverage for the specified filename should be parsed. */
function shouldParse(fileName) {
	for (let exclude of excludes) {
		if (fileName.includes(exclude)) {
			return false;
		}
	}
	return true;
}

/** Sets or merges the specified covered lines for the specified file. */
function setOrMergeCoverage(fileName, coveredLines) {
	if (coveredLines.length < 1) {
		return;
	}
	let existingCoverage = mergedCoverage[fileName] || new Set([]);
	let newCoverage = new Set(coveredLines);
	let combinedCoverage = new Set([...newCoverage, ...existingCoverage]);
	mergedCoverage[fileName] = combinedCoverage
}

/** Issue an error and end the script. */
function error(error) {
	throw new Error(error);
}

/** Convert sets into arrays to be usable in JSON.stringify. */
function cleanupMergedCoverage() {
	Object.keys(mergedCoverage).forEach(fileName => {
		mergedCoverage[fileName] = [...mergedCoverage[fileName]];
	});	
}

/** Saves the coverage to different formats. */
function saveCoverage() {
	if (format === 'lcov') {
		saveAsLcovReport();
	}
	else if (format === 'json') {
		saveAsJSON();
	}
}

/** Saves the coverage as JSON object. */
function saveAsJSON() {
	fs.writeFile(outputFile, JSON.stringify(mergedCoverage), encoding, (err) => {
		if (err) {
			error(err);
		}
	});
}

/** Saves the coverage as LCOV report. */
function saveAsLcovReport() {
	let lcovReport = '';
	Object.keys(mergedCoverage).forEach(fileName => {
		const coverage = mergedCoverage[fileName];
		lcovReport += getLcovEntryForFile(fileName, coverage);
	});	
	fs.writeFile(outputFile, lcovReport, encoding, (err) => {
		if (err) {
			error(err);
		}
	});
}

/** Gets an LCOV entry for a specific file and coverage object. Only uses the flags for line coverage. */
function getLcovEntryForFile(fileName, coverage) {
	let entry = 'TN:\n';
	entry += 'SF:' + fileName + '\n';

	coverage.forEach(coveredLine => {
		entry += 'DA:' + coveredLine + ',1\n';
	});

	entry += 'end_of_record\n';
	return entry;
}

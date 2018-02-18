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

const fs = require('fs');

let mergedCoverage = {};
let excludes = ['closure-library:', 'generated', 'soyutils_usegoog'];
let encoding = 'utf8';
let outputFile = 'output.lcov';
let format = 'lcov';

/** Merges and saves coverage from the specified files. */
exports.mergeCoverage = function(inputFileNames) {
	parseFiles(inputFileNames);
	saveCoverage();
}

/** Parses the input files. */
function parseFiles(inputFileNames) {
	inputFileNames.forEach(fileName => {
		let coverage = JSON.parse(fs.readFileSync(fileName, encoding));
		checkCoverage(fileName, coverage);
		parseCoverage(coverage);
	});
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

		setOrMergeCoverage(mergedCoverage, fileName, coveredLines);
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
function setOrMergeCoverage(mergedCoverage, fileName, coveredLines) {
	if (coveredLines.length < 1) {
		return;
	}
	let existingCoverage = mergedCoverage[fileName] || [];
	coveredLines.push.apply(coveredLines, existingCoverage);
	let combinedCoverage = new Set(coveredLines);
	mergedCoverage[fileName] = Array.from(combinedCoverage);
}

/** Issue an error and end the script. */
function error(error) {
	throw new Error(error);
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

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

/** Merges Closure coverage objects and saves the result as report. */
module.exports.ClosureCoverageMerger = class ClosureCoverageMerger {

	/** Creates a coverage merger. */
	constructor(excludes, format, encoding) {
		this.excludes = excludes;
		this.format = format;
		this.encoding = encoding;
		this.mergedCoverage = {};
	}

	// getMergedCoverage

	/** Merges and saves coverage from the specified files. */
	mergeCoverage(inputFileNames, outputFile) {
		this.parseFiles(inputFileNames);
		this.saveCoverage(outputFile);
	}

	/** Parses the input files. */
	parseFiles(inputFileNames) {
		inputFileNames.forEach(fileName => {
			let coverage = JSON.parse(fs.readFileSync(fileName, this.encoding));
			this.checkCoverage(fileName, coverage);
			this.parseCoverage(coverage);
		});
		console.log('Generated coverage for ' + Object.keys(this.mergedCoverage).length + ' files.');
	}

	/** Basic checks for the structure of the provided coverage. */
	checkCoverage(inputFileName, coverage) {
		if (coverage.executedLines === undefined || coverage.instrumentedLines === undefined || coverage.fileNames === undefined) {
			this.error('Wrong format of coverage in ' + inputFileName);
		}
		if (coverage.executedLines.length !== coverage.fileNames.length) {
			this.error('Number of files and number of lines do not match in ' + inputFileName);
		}
	}

	/** Parses the provided coverage object. */
	parseCoverage(coverage) {
		for (let i = 0; i < coverage.fileNames.length; ++i) {
			let fileName = coverage.fileNames[i];

			if (!this.shouldParse(fileName)) {
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

			this.setOrMergeCoverage(fileName, coveredLines);
		}
	}

	/** Determines whether coverage for the specified filename should be parsed. */
	shouldParse(fileName) {
		for (let exclude of this.excludes) {
			if (fileName.includes(exclude)) {
				return false;
			}
		}
		return true;
	}

	/** Sets or merges the specified covered lines for the specified file. */
	setOrMergeCoverage(fileName, coveredLines) {
		if (coveredLines.length < 1) {
			return;
		}
		let existingCoverage = this.mergedCoverage[fileName] || [];
		coveredLines.push.apply(coveredLines, existingCoverage);
		let combinedCoverage = new Set(coveredLines);
		this.mergedCoverage[fileName] = Array.from(combinedCoverage);
	}

	/** Issue an error and end the script. */
	error(error) {
		throw new Error(error);
	}

	/** Saves the coverage to different formats. */
	saveCoverage(outputFile) {
		if (this.format === 'lcov') {
			this.saveAsLcovReport(outputFile);
		}
		else if (this.format === 'json') {
			this.saveAsJSON(outputFile);
		}
	}

	/** Saves the coverage as JSON object. */
	saveAsJSON(outputFile) {
		fs.writeFile(outputFile, JSON.stringify(this.mergedCoverage), this.encoding, (err) => {
			if (err) {
				this.error(err);
			}
		});
	}

	/** Saves the coverage as LCOV report. */
	saveAsLcovReport(outputFile) {
		let lcovReport = '';
		Object.keys(this.mergedCoverage).forEach(fileName => {
			const coverage = this.mergedCoverage[fileName];
			lcovReport += this.getLcovEntryForFile(fileName, coverage);
		});	
		fs.writeFile(outputFile, lcovReport, this.encoding, (err) => {
			if (err) {
				this.error(err);
			}
		});
	}

	/** Gets an LCOV entry for a specific file and coverage object. Only uses the flags for line coverage. */
	getLcovEntryForFile(fileName, coverage) {
		let entry = 'TN:\n';
		entry += 'SF:' + fileName + '\n';

		coverage.forEach(coveredLine => {
			entry += 'DA:' + coveredLine + ',1\n';
		});

		entry += 'end_of_record\n';
		return entry;
	}
}

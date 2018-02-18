const assert = require('chai').assert;
const rewire = require('rewire');
const merger = rewire('../../src/closure-coverage-merger.js');

/** Tests for closure-coverage-merger.js */
suite('closure-coverage-merger', function() {

	test('should correctly union covered line numbers', function() {
		const setOrMergeCoverage = merger.__get__('setOrMergeCoverage');
		const mergedCoverage = {};

		setOrMergeCoverage(mergedCoverage, 'a', [1,2,3]);
		assertStoredCoverageEquals(mergedCoverage, 'a', [1,2,3]);

		setOrMergeCoverage(mergedCoverage, 'a', []);
		assertStoredCoverageEquals(mergedCoverage, 'a', [1,2,3]);

		setOrMergeCoverage(mergedCoverage, 'a', [2,3,4]);
		assertStoredCoverageEquals(mergedCoverage, 'a', [1,2,3,4]);
	});

	/** Helper to check for correct coverage. */
	function assertStoredCoverageEquals(mergedCoverage, fileName, coverage) {
		assert.isDefined(mergedCoverage[fileName]);
		assert.isArray(mergedCoverage[fileName]);
		assert.sameMembers(mergedCoverage[fileName], coverage);
	}
});
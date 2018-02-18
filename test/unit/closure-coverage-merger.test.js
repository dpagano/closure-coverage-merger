const assert = require('chai').assert;
const ClosureCoverageMerger = require('../../src/closure-coverage-merger.js').ClosureCoverageMerger;

/** Tests for ClosureCoverageMerger */
suite('ClosureCoverageMerger', function() {

	test('should correctly union covered line numbers', function() {
		const merger = new ClosureCoverageMerger();

		merger.setOrMergeCoverage('a', [1,2,3]);
		assertStoredCoverageEquals(merger.mergedCoverage, 'a', [1,2,3]);

		merger.setOrMergeCoverage('a', []);
		assertStoredCoverageEquals(merger.mergedCoverage, 'a', [1,2,3]);

		merger.setOrMergeCoverage('a', [2,3,4]);
		assertStoredCoverageEquals(merger.mergedCoverage, 'a', [1,2,3,4]);
	});

	/** Helper to check for correct coverage. */
	function assertStoredCoverageEquals(mergedCoverage, fileName, coverage) {
		assert.isDefined(mergedCoverage[fileName]);
		assert.isArray(mergedCoverage[fileName]);
		assert.sameMembers(mergedCoverage[fileName], coverage);
	}
});
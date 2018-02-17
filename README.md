Coverage merger for the Google Closure Compiler. Merges multiple coverage objects stored in JSON files and outputs them as a single JSON or LCOV report.

# Prerequisites

Run `npm i` to install dependencies.

# Instrumentation

The [Google Closure Compiler](https://github.com/google/closure-compiler) is able to instrument the compiled source code to gather coverage. This adds a field `__jscov` to the `window` object, which can be read and serialized to a JSON file after a test case run.

This script reads in such JSON files, combines the contained coverage, and outputs the results as JSON representation or LCOV report.

# Usage

```bash
usage: closure-coverage-merger.js [-h] [-v] [-o OUTPUT] -i INPUT [INPUT ...]
                                  [-x EXCLUDES] [-e ENCODING] [-f {lcov,json}]
                                  

Coverage merger for the Google Closure Compiler. Merges multiple coverage 
objects stored in JSON files and outputs them as a single JSON or LCOV report.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -o OUTPUT, --output OUTPUT
                        Name of the output file. Defaults to output.lcov
  -i INPUT [INPUT ...], --input INPUT [INPUT ...]
                        Input files containing the coverage objects
  -x EXCLUDES, --excludes EXCLUDES
                        Exclude coverage for specific filenames. Coverage 
                        will not be processed for files whose filename 
                        contains one of these strings. Defaults to 
                        ["closure-library:","generated","soyutils_usegoog"]
  -e ENCODING, --encoding ENCODING
                        Encoding to use when reading coverage files. Defaults 
                        to utf8
  -f {lcov,json}, --format {lcov,json}
                        Format of the created report. Defaults to lcov

```

# Caveats

Theoretically, the Closure Compiler is able to instrument for statement and branch coverage. However, for now, this script only interprets the line coverage part.

# License

Copyright [2018] [Dennis Pagano]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
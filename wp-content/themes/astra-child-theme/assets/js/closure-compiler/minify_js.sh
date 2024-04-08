#!/usr/bin/env bash

# Get the directory the script is in
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# Get input and output file names
JS_DIR="$SCRIPT_DIR/.."
JAR_FILE_NAME="$JS_DIR/closure-compiler/closure-compiler-v20240317.jar"
OUTPUT_FILE_NAME="$JS_DIR/minified/main.min.js"

# Remove the old minified file
rm "$OUTPUT_FILE_NAME"

# Minify all JS files except those ending in _test.js
java -jar "$JAR_FILE_NAME" --js="$JS_DIR/unminified/**.js" --js="$JS_DIR/unminified/!**_test.js" --js_output_file "$OUTPUT_FILE_NAME"
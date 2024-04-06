# If command-line argument --js-dir is provided, use that as the JS directory. Otherwise, use the default JS directory.
if [ "$1" == "--js-dir" ]; then
	JS_DIR="$2";
else
	JS_DIR='/bitnami/wordpress/wp-content/themes/astra-child-theme/assets/js';
fi
JAR_FILE_NAME="$JS_DIR/closure-compiler/closure-compiler-v20240317.jar"
OUTPUT_FILE_NAME="$JS_DIR/minified/main.min.js"
rm "$OUTPUT_FILE_NAME"
java -jar "$JAR_FILE_NAME" --js="$JS_DIR/unminified/**.js" --js="$JS_DIR/unminified/!**_test.js" --js_output_file "$OUTPUT_FILE_NAME"
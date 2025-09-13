:Date: 2025-09-13

:Version: 2.1.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

JamUtils, simple js utilities I use.

What is JamUtils?

    JamUtils was created to help me do the following:
    
        - sleep function, allowing me to pause execution for a few seconds.
        - web page keyboard shortcuts.
        - I plan to add any other functionalities I find useful and too general
          with little complication to be a dedicated library.

Usage:
    
    Require via require.js:
    
    <script src="require.js"></script>
    <script>
        requirejs(
            'jam-utils',
            function(JamUtils) {
                //now you have JamUtils object
            }
        );
    </script>
    
    Or add jam-utils.js in a <script> tag in your html file:
    
    <script src="path-to-jam-utils.js"></script>
    
    If you add as a script tag directly, you will get a JamUtils global object
    with all the functionalities provided by the library.


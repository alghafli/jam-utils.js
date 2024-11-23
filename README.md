:Date: 2024-11-23

:Version: 1.1.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

JamUtils, simple js utilities I use.

The problem:

    I was happy to see the import statement and modules in javascript.
    Unfortunately, import does not work in local files and we are forced to go
    back and use all the <script> tags again in our html files. On top of  that,
    many js libraries I used have funny behaviour when imported in the browser.

What is JamUtils?

    JamUtils was created to help me do the following:
    
        - import scripts in local html files.
        - sleep function, allowing me to pause execution for a few seconds.
        - web page keyboard shortcuts.
        - I plan to add any other functionalities I find useful and too general
          with little complication to be a dedicated library.

Usage:

    Add jam-utils.js in a <script> tag in your html file.
    
    <script src="path-to-jam-utils.js"></script>
    
    You will get a JamUtils global object with all the functionalities provided
    by the library.


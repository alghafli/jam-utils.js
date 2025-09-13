//define module for requirejs--------------------------------------------------------------------

/*
:Date: 2025-01-24

:Version: 2.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Define JamUtils object to be required by requirejs. If requirejs is not
available, JamUtils will be defined as a global object.
*/

if (typeof define === 'function' && define.amd) {
    define(JamUtils);
}
else {
    window.JamUtils = JamUtils;
}

}   //end top level block to prevent global space variables

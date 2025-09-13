//import utils------------------------------------------------------------------
/*
:Date: 2024-11-15

:Version: 0.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Import utils, allows you to import other javascript files if you cannot use
builtin js import statement.

JamUtils import is made mainly to be able to import scripts from other scripts
used in local html files. All browsers I used does not allow you to use
type="module" in any <script> tag unless you have a web server.

Import other scripts:

    To import a script located in content/scripts/example.js file relative to
    the location of your html file:
    
        await JamUtils.import('content/scripts/example.js');
        //execution will continue here after the script is loaded
        //you can omit the await to get a promise that will resolve after
        //successfully loading the script
    
    To import a script relative to a specific location, instantiate a JamUtils
    object with base_url option:
    
        let importer = new JamUtils({base_url: 'content/scripts/'});
        await importer.import('example.js');
        //will import content/scripts/example.js
        //again, execution will continue here after the script is loaded or you
        //can omit the await to get a promise.
    
    To import a script relative to your js file, instantiate JamUtils object
    without options:
    
        let importer = new JamUtils();
        await importer.import('example.js');
        //will import example.js located in the same directory as the
        //calling script.
        //again, execution will continue here after the script is loaded  or you
        //can omit the await to get a promise.
    
    You can include attributes to your imported scripts using the attrs property
    in the options parameter:
    
        JamUtils('example.js', {attrs: {referrerpolicy: 'no-referrer'}});
    
How import works:

    - JamUtils imports is done by appending a script tag inside the head tag.
    - JamUtils.import function returns a promise that resolves after the script
      is loaded successfully.
    - If an error occures when loading the script, the script tag will be
      removed and the returned promise rejects.
    - JamUtils only imports a js file once. All attempts to import a js file
      after it was already imported will be ignored without error. JamUtils
      resolves relative paths to absolute paths before checking if the file was
      imported.
*/

JamUtils._import_on_load_cb = function (
        resolve, absolute_url, name, alias, evt) {
    
    JamUtils.imported_modules.add(absolute_url);
    if (name != undefined && alias != undefined) {
        window[alias] = window[name];
    }
    evt.target.removeEventListener('error', JamUtils._import_on_error_cb);
    resolve();
}

JamUtils._import_on_error_cb = function (reject, absolute_url, evt) {
    evt.target.removeEventListener('load', JamUtils._import_on_load_cb);
    evt.target.remove();
    return reject(`failed to import script at ${absolute_url}`);
}

JamUtils.imported_modules = new Set();

JamUtils.constructors.push(function (options) {
        this.base_url = options.base_url ?? document.currentScript.src;
    }
)

JamUtils.import = function (url, options = {}) {
    console.warn('JamUtils.import is deprecated. Use RequireJS instead.');    
    
    let base_url = new URL(options.base_url ?? document.baseURI).href;
    let absolute_url = new URL(url, base_url).href;
    
    if (this.imported_modules.has(absolute_url)) {
        console.debug(
            `ignored import of already imported script "${absolute_url}"`
        );
        return;
    }
    
    let {promise, resolve, reject} = Promise.withResolvers();
    
    let script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = absolute_url;
    let attrs = options.attrs ?? {};
    for (let attr in attrs) {
        script.setAttribute(attr, attrs[attr]);
    }
    
    script.addEventListener(
        'load',
        JamUtils._import_on_load_cb.bind(
            null, resolve, absolute_url, options.name, options.alias
        ),
        {once: true}
    );
    script.addEventListener(
        'error', JamUtils._import_on_error_cb.bind(null, reject, absolute_url), {once: true}
    );
    
    document.head.append(script);
    
    return promise;
}

JamUtils.prototype.import = function (url, options = {}) {
    console.warn('JamUtils.import is deprecated. Use RequireJS instead.');
    
    options.base_url = this.base_url;
    return this.constructor.import(url, options);
}


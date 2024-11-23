/*
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
*/

//create JamUtils global constructor function
function JamUtils(options = {}) {
    for (let f of JamUtils.constructors) {
        f.call(this, options);
    }
}

JamUtils.constructors = [];

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
    options.base_url = this.base_url;
    return this.constructor.import(url, options);
}

//misc utils--------------------------------------------------------------------

/*
:Date: 2024-11-15

:Version: 0.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Misc utils. Currently only has a sleep function.

sleep function:

    await JamUtils.sleep(1.5);  //returns after 1.5 seconds
*/

//async sleep for t seconds
JamUtils.sleep = function (t) {
    return new Promise((res, rej) => setTimeout(res, 1000 * t));
}

JamUtils.for_each_selector = function(obj, cb, options = {}) {
    let root = options.root ?? document;
    
    for (selector in obj) {
        let elems;
        
        if (options.all) {
            elems = root.querySelectorAll(selector);
        }
        else {
            elems = root.querySelector(selector);
            elems = elems == null ? [] : [elems];
        }
        
        if (elems.length == 0) {
            console.warn(
                `could not find any matching element for selector '${selector}'`
            );
            continue;
        }
        
        for (let elem of elems) {
            cb(elem, obj[selector]);
        }
    }
};

JamUtils.add_listeners_from_object = function (obj, options = {}) {
    JamUtils.for_each_selector(
        obj,
        (elem, obj) => {
            for (let evt_name in obj) {
                elem.addEventListener(evt_name, obj[evt_name]);
            }
        },
        options
    );
};

//shortcuts utils-----------------------------------------------------------------

JamUtils.shortcuts = {
    shortcuts: new Map(),
    
    add(elem, shortcut, evt) {
        if (!JamUtils.shortcuts.shortcuts.has(elem)) {
            JamUtils.shortcuts.shortcuts.set(elem, new Map());
        }
        
        let elem_shortcuts = JamUtils.shortcuts.shortcuts.get(elem);
        elem_shortcuts.set(shortcut, evt);
    },
    delete(elem, shortcut) {
        let elem_shortcuts = JamUtils.shortcuts.shortcuts.get(elem);
        elem_shortcuts.delete(shortcut);
        
        if (elem_shortcuts.size == 0) {
            JamUtils.shortcuts.shortcuts.delete(elem);
        }
    },
    
    on_shortcut(evt) {
        //check shortcuts obj exists for element
        let target_shortcuts = JamUtils.shortcuts.shortcuts.get(evt.currentTarget);
        
        if (target_shortcuts == undefined || evt.repeat) return;
        
        //check pressed shortcut exists
        let pressed = [];
        if (evt.ctrlKey) pressed.push('ctrl');
        if (evt.altKey) pressed.push('alt');
        if (evt.shiftKey) pressed.push('shift');
        pressed.push(evt.code);
        
        let new_evt = target_shortcuts.get(pressed.join('+'));
        
        if (new_evt == undefined) return;
        
        //everything is fine. stop event propagation.
        evt.stopPropagation();
        evt.preventDefault();
        
        //call callback function
        if (new_evt instanceof Function) {
            new_evt(
                {target: evt.currentTarget, currentTarget: evt.currentTarget}
            );
        }
        //or get event object and dispatch it
        else {
            if (typeof new_evt == "string") {
                new_evt = new Event(new_evt);
            }
            evt.currentTarget.dispatchEvent(new_evt);
        }
    },
    
    
    from_object(obj, options = {}) {
        JamUtils.for_each_selector(
            obj,
            (elem, obj) => {
                for (let keys in obj) {
                    JamUtils.shortcuts.add(elem, keys, obj[keys]);
                }
            },
            options
        );
    },
};


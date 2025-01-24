/*
:Date: 2025-01-24

:Version: 2.0.0

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

'use strict'
{   //start top level block to prevent global space variables

//create JamUtils
let JamUtils = {}

//misc utils--------------------------------------------------------------------

/*
:Date: 2025-01-24

:Version: 2.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Misc utils.

sleep function:

    await JamUtils.sleep(1.5);  //returns after 1.5 seconds
*/

//async sleep for t seconds
JamUtils.sleep = function (t) {
    return new Promise((res, rej) => setTimeout(res, 1000 * t));
}

JamUtils.for_each_selector = function(obj, cb, options = {}) {
    let root = options.root ?? document;
    
    for (let selector in obj) {
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

/*
:Date: 2025-01-24

:Version: 2.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>
*/

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

//calendar utils-----------------------------------------------------------------

/*
:Date: 2025-01-24

:Version: 2.0.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Calendar converter. mainly made to convert between gregorian and islamic
calendars.

to convert a javascript date object:
    let my_date = new Date();
    let islamic_date = JamUtils.calendars.from_native(my_date, 'islamic');
    //now islamic_date is an object with properties {year, month, day} after
    //conversion to islamic date.

to convert an object of {year, month, day} to javascript date object:
    let islamic_date = {year: 1440, month: 10, day: 13};
    let my_date = JamUtils.calendars.to_native(islamic_date, 'islamic');

to convert an object of {year, month, day} from calendar to calendar:
    let islamic_date = {year: 1440, month: 10, day: 13};
    let gregorian_date = JamUtils.calendars.convert(islamic_date, 'islamic', 'gregorian');
    //converts from islamic to gregorian.
*/

JamUtils.calendars = {
    NATIVE_CALENDAR: 'gregory',
    
    MULTIPLIERS: {
        'year': ['min_days', 'min_months'],
        'month': ['min_days'],
        'day': [],
    },
    
    calendars: {
        gregory: {
            min_days: 28,
            min_months: 12,
        },
        islamic: {
            min_days: 29,
            min_months: 12,
        },
        'islamic-umalqura': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-tbla': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-civil': {
            min_days: 29,
            min_months: 12,
        },
        'islamic-rgsa': {
            min_days: 29,
            min_months: 12,
        },
        persian: {
            min_days: 29,
            min_months: 12,
        },
    },
    
    add(name, min_days, min_months) {
        this.calendars[name] = {min_days, min_months};
    },
    
    delete(name) {
        delete this.calendars[name];
    },
    
    convert(date, source='gregory', target='islamic') {
        let native_date = this.to_native(date, source);
        return this.from_native(native_date, target);
    },
    
    to_native(date, calendar) {
        if (calendar == this.NATIVE_CALENDAR) {
            return new Date(date.year, date.month - 1, date.day);
        }
        
        let today = new Date();
        let result = {
            year: today.getFullYear(),
            month: today.getMonth() + 1,
            day: today.getDate()
        };
        
        let converter = Intl.DateTimeFormat('en', {calendar: calendar});
        
        for (let part of ['year', 'month', 'day']) {
            let error = Number.POSITIVE_INFINITY;
            //cycles would probably be very few.
            //setting max cycles only to discover bugs in the loop.
            for (let cycles = 10;error != 0;cycles--) {
                if (cycles <= 0) {
                    let msg = 'max approximation cycles exceeded. ' +
                        'is date conversion buggy?';
                }
                
                let native_date = new Date(
                    result.year,
                    result.month - 1,
                    result.day
                );
                
                let approx = {};
                converter.formatToParts(native_date).forEach(
                    obj => {
                        approx[obj.type] = Number(obj.value);
                    }
                );
                
                error = date[part] - approx[part];
                
                result.year = native_date.getFullYear();
                result.month = native_date.getMonth() + 1;
                result.day = native_date.getDate();
                
                for (let multiplier of this.MULTIPLIERS[part]) {
                    error *= this.calendars[calendar][multiplier];
                }
                
                result.day += error;
            }
        }
        
        return new Date(result.year, result.month - 1, result.day);
    },
    
    from_native(date, calendar) {
        let converter = Intl.DateTimeFormat('en', {calendar: calendar});
        let converted = {};
        converter.formatToParts(date).forEach(
            obj => {
                converted[obj.type] = Number(obj.value);
            }
        );
        
        return {
            year: converted.year,
            month: converted.month,
            day: converted.day
        };
    }
};

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
    define(() => JamUtils);
}
else {
    window.JamUtils = JamUtils;
}

}   //end top level block to prevent global space variables

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
*/

'use strict'
{   //start top level block to prevent global space variables

//create JamUtils
let JamUtils = {}

//events utils-----------------------------------------------------------------

/*
:Date: 2025-09-12

:Version: 2.1.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Allows you to handle events with modifiers. The method you want to use is
add_event_listener(elem, evt_info, f) where:
    
    - elem: element to add the listener to.
    - evt_info: the event name with modifiers.
    - f: the function to handle the event.

The rules for event modifiers are as follows:

    - start with event name. e.g. `keydown`.
    - can add conditions to test between []. the tests syntax:
        - may start with `!` which will negate the whole test. if the test is
          true, it will become false and vise versa.
        - must have  an event property (e.g. the `code` or `altKey` property for
          the `keydown` event).
        - may have an operator. see JamUtils.events.operators for supported
          operators.
        - if it has an operator, it must have a second operand which can be:
            - a numeric value. e.g. 123.
            - a string. e.g. "hello". you can use single or double quotes.
            - an identifier which exists in JamUtils.events.variables. currently
              the available identifiers are:
                - ARROW_FORWARD: returns the string `ArrowLeft` if the element
                  direction is `rtl`. otherwise it returns the string
                  `ArrowRight`.
                - ARROW_BACKWARD: returns the opposite of ARROW_FORWARD.
    - can add `.<method>` to call event methods if tests are successful.
      currently supported methods are:
        - stop: calls stopPropagation.
        - stopImmediate: calls stopImmediatePropagation.
        - prevent: calls preventDefault.
    
below are some examples:
    
    - click[altKey][!ctrlKey].prevent: click event with alt key pressed and ctrl
      key not pressed. also calls preventDefault.
    - keydown[!code>"KeyM"]: key down where the code is anything not greater
      than `KeyM`. could have used [code<="KeyM"] instead.
    - keydown .stop[ code = ARROW_FORWARD ] .prevent [ctrlKey] [!altKey]:
      spaces are ignored. used ARROW_FORWARD variable. tests and methods order
      does not matter.
*/


JamUtils.events = {
  variables: {
    ARROW_FORWARD(evt) {
      return getComputedStyle(evt.target).direction == 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    },
    ARROW_BACKWARD(evt) {
      return getComputedStyle(evt.target).direction != 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    },
  },
  operators: {
    '=': (a, b) => a == b,
    '!=': (a, b) => a != b,
    '>': (a, b) => a > b,
    '>=': (a, b) => a >= b,
    '<': (a, b) => a < b,
    '<=': (a, b) => a <= b,
    'startsWith': (a, b) => a.startsWith(b),
    'endsWith': (a, b) => a.endsWith(b),
    'includes': (a, b) => a.includes(b),
  },
  methods: {
    'stop': evt => evt.stopPropagation(),
    'stopImmediate': evt => evt.stopImmediatePropagation(),
    'prevent': evt => evt.preventDefault(),
  },
  event_regex: /[\w-]+/y,
  modifiers_regex: /\[(?<test>[^\]]*)\]|\.(?<method>\w+)/g,
  test_regex: /^\s*(?<_not>!)?\s*(?<_a>\w+)\s*(?:(?:(?<_op>[^\w\s]+)|\s(?<_op_word>[^\s'"]+)\s)\s*(?<_b>\d+|['"].*['"]|\w+))?\s*$/y,
  str_regex: /^['"](?<text>.*)['"]$/y,
  parse(text) {
    this.event_regex.lastIndex = 0;
    this.modifiers_regex.lastIndex = 0;
    
    let event_name = this.event_regex.exec(text)[0];
    
    let modifiers_str = text.substring(this.event_regex.lastIndex);
    let modifiers = modifiers_str.matchAll(this.modifiers_regex);
    
    let tests = [];
    let methods = [];
    for (let m of modifiers) {
      if (m.groups.test != undefined) {
        tests.push(m.groups.test);
      }
      else {
        methods.push(m.groups.method);
      }
    }
    
    for (let idx in tests) {
      let t = tests[idx];
      
      this.test_regex.lastIndex = 0;
      let parsed_test = this.test_regex.exec(t);
      
      if (parsed_test == null) {
        throw 'invalid pattern';
      }
      else {
        let test_obj = {
          not: parsed_test.groups._not != undefined,
          op: parsed_test.groups._op || parsed_test.groups._op_word,
          a: parsed_test.groups._a,
          b: parsed_test.groups._b,
          replace_b: false,
        };

        let float_value = parseFloat(test_obj.b);
        this.str_regex.lastIndex = 0;
        
        if (!Number.isNaN(float_value)) {
          test_obj.b = float_value;
        }
        else if (this.str_regex.exec(test_obj.b)) {
          test_obj.b = test_obj.b.substring(1, test_obj.b.length - 1);
        }
        else if (test_obj.b != undefined) {
          test_obj.replace_b = true;
        }

        tests[idx] = test_obj;
      }
    }
    
    return {
      event: event_name,
      tests: tests,
      methods: methods,
    };
  },
  check_tests(tests, evt) {
    for (let t of tests) {
      let result = evt[t.a];
      if (t.op != undefined) {
        let a = result;
        let b = t.b;
        if (t.replace_b) {
          b = this.variables[b](evt);
        }
        result = this.operators[t.op](a, b);
      }
      result = t.not ? !result : result

      if (! result) {
        return false;
      }
    }

    return true;
  },
  apply_methods(methods, evt) {
    for (let m of methods) {
      this.methods[m](evt);
    }
  },
  modify_listener(evt_info, f) {
    let this_obj = this;
    
    return function (evt) {
      if (this_obj.check_tests(evt_info.tests, evt)) {
        this_obj.apply_methods(evt_info.methods, evt);
        f(evt);
      }
    };
  },
  add_event_listener(elem, evt_info, f) {
    if (typeof f == 'string') {
        f = new CustomEvent(f);
    }
    if (f instanceof Event) {
        let new_evt = f;
        f = (evt) => evt.currentTarget.dispatchEvent(new_evt);
    }
    
    if (typeof evt_info != 'object') {
      evt_info = this.parse(evt_info);
    }
    
    if (evt_info.tests.length || evt_info.methods.length) {
        f = this.modify_listener(evt_info, f);
    }
    
    elem.addEventListener(evt_info.event, f);
    
    return f;
  },
};

//shortcuts utils-----------------------------------------------------------------

/*
:Date: 2025-09-13

:Version: 2.1.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>
*/

JamUtils.shortcuts = {
    shortcuts: new Map(),
    
    add(elem, shortcut, evt) {
        console.warn('JamUtils.events is a better alternative to JamUtils.shortcuts. Consider using it.');
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
                new_evt = new CustomEvent(new_evt);
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

//misc utils--------------------------------------------------------------------

/*
:Date: 2025-09-13

:Version: 2.1.0

:Authors:

    * Mohammad Alghafli <thebsom@gmail.com>

Misc utils.

sleep function:

    await JamUtils.sleep(1.5);  //returns after 1.5 seconds

for_each_selector:
    
    //create object where keys are css selectors and values are anything you
    //wish
    let selectors = {
        body: 'white',
        '.background-red': 'red',
    };
    
    //call this method and it will call the callback function for all elements
    //selected by the css selector in the keys
    
    //arg 1: your object defined above
    //arg 2: callback for each selected element
    //arg 3: options:
    //  root: the root element you want to apply the selectors to. By default,
    //        it is the root document.
    //  all: if true, applies the callback to all elements that match the
    //       selector. By default, it only applies to the first matching
    //       element.
    for_each_selector(
        selectors,
        (elem, v) => {elem.style.backgroundColor = v},
        {root: document, all: true}
    );
    
add_listeners_from_object:

    //create object where keys are css selectors and values are other objects
    //describing your events. see example below:
    let selectors = {
        //key is body selector. value is another object.
        //inner object key is event name. value is handler.
        body: {
            'click': (evt) => {
                console.log('body clicked');
            },
            //another event and handler
            'keydown': (evt) => {
                console.log('key pressed on body');
            }
        },
        //class selector for random-background class
        '.random-background': {
            //event can have modifiers. see JamUtils.events for more info.
            //in this case, the handler is a string. if keydown event occurs
            //with all conditions met (ctrlKey pressed and button is B) then
            //a 'change-background' event will be dispatched.
            //the value can also be an event object instead of a string.
            'keydown[ctrlKey][code="KeyB"].stop.prevent': 'change-background',
            //you can use custom event names
            'change-background': (evt) => {
                evt.currentTarget.style.background = 'red';
            }
        }
    };
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
                JamUtils.events.add_event_listener(elem, evt_name, obj[evt_name]);
            }
        },
        options
    );
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
    define(JamUtils);
}
else {
    window.JamUtils = JamUtils;
}

}   //end top level block to prevent global space variables

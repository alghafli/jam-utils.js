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


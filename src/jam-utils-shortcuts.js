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


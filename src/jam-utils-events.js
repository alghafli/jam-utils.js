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


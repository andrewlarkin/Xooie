/*
*   Copyright 2012 Comcast
*
*   Licensed under the Apache License, Version 2.0 (the "License");
*   you may not use this file except in compliance with the License.
*   You may obtain a copy of the License at
*
*       http://www.apache.org/licenses/LICENSE-2.0
*
*   Unless required by applicable law or agreed to in writing, software
*   distributed under the License is distributed on an "AS IS" BASIS,
*   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*   See the License for the specific language governing permissions and
*   limitations under the License.
*/

define(['jquery', 'base'], function($, Base) {

    var Dropdown = Base('dropdown', function() {
        var self = this,
            trigger,
            handles = self.getHandle(),
            expanders = self.getExpander(),

            onTriggers = this.options.triggers.on,
            offTriggers = self.options.triggers.off,
            toggleTriggers = this.options.triggers.toggle;

        var getTriggerHandle = function(triggerData, index){
            if (triggerData.selector) {
                return triggerData.selector === 'document' ? $(document) : $(triggerData.selector);
            } else {
                return typeof index === 'undefined' ? handles : handles.eq(index);
            }
        };

        this.timers = {
            expand: [],
            collapse: [],
            throttle: []
        };

        for (trigger in onTriggers) {
            getTriggerHandle(onTriggers[trigger]).on(trigger, {delay: onTriggers[trigger].delay}, function(event){
                var index = parseInt($(this).attr('data-dropdown-index'), 10),
                    delay = event.data.delay,
                    handle = $(this),
                    trigger;

                event.preventDefault();

                for (trigger in offTriggers) {
                    handle.on(trigger, {delay: offTriggers[trigger].delay, el: handle}, function(event){
                        if (($(event.target).is(self.getExpander(index)) || $(event.target).parents(self.options.dropdownExpanderSelector).length > 0) && !$(event.target).is(event.data.el)) {
                            return true;
                        }

                        event.preventDefault();

                        self.collapse(index, event.data.delay);

                        $(this).unbind(event);
                    });
                }

                self.expand(index, delay);
            });
        }

        for (trigger in toggleTriggers) {
            getTriggerHandle(toggleTriggers[trigger]).on(trigger, {delay: toggleTriggers[trigger].delay}, function(event){
                var index = parseInt($(this).attr('data-dropdown-index'), 10),
                    delay = event.data.delay;

                self.setState(index, delay, !self.getExpander(index).hasClass(self.options.activeDropdownClass));
            });
        }

        handles.each(function(index){
            var handle = $(this),
                expander = expanders.eq(index);

            handle.attr('data-dropdown-index', index);
            expander.attr('data-dropdown-index', index);
        });

        expanders.on('mouseover', function(){
            var index = parseInt($(this).attr('data-dropdown-index'), 10);

            if (self.timers.collapse[index]){
                self.timers.collapse[index] = clearTimeout(self.timers.collapse[index]);

                $(this).on('mouseleave', {index: index}, function(event){
                    self.collapse(event.data.index, 0);
                    $(this).unbind(event);
                });
            }
        });

    });

    Dropdown.setDefaultOptions({
        dropdownHandleSelector: '[data-role="dropdown-handle"]',
        dropdownExpanderSelector: '[data-role="dropdown-content"]',

        activeDropdownClass: 'is-dropdown-active',

        throttleDelay: 300,
        triggers: {
            on: {
                focus: {
                    delay: 0
                }
            },
            off: {
                blur: {
                    delay: 0
                }
            },
            toggle: {
                click: {
                    delay: 0
                }
            }
        }

    });

    $.extend(Dropdown.prototype, {
        getHandle: function(index){
            var handles = this.root.find(this.options.dropdownHandleSelector);

            return (typeof index !== 'undefined' && index >= 0) ? handles.eq(index) : handles;
        },

        getExpander: function(index){
            var expanders = this.root.find(this.options.dropdownExpanderSelector);

            return (typeof index !== 'undefined' && index >= 0) ? expanders.eq(index) : expanders;
        },

        setState: function(index, delay, active){
            var state = active ? 'expand' : 'collapse',
                counterState = active ? 'collapse' : 'expand';

            this.timers[counterState][index] = clearTimeout(this.timers[counterState][index]);

            if (this.timers.throttle[index] || this.timers[state][index]) {
                return;
            }

            this.timers[state][index] = setTimeout(function(i, _state, _active) {
                var expander = this.getExpander(i),
                    handle = this.getHandle(i),
                    self = this;

                this.timers[_state][i] = clearTimeout(this.timers[_state][i]);

                expander.toggleClass(this.options.activeDropdownClass, _active);
                this.getHandle(i).toggleClass(this.options.activeDropdownClass, _active);

                if (_active){
                    expander.focus();
                    handle.trigger('dropdownExpand', i);
                } else {
                    handle.trigger('dropdownCollapse', i);
                }

                if (this.options.throttleDelay > 0){
                    this.timers.throttle[i] = setTimeout(function(){
                        self.timers.throttle[i] = clearTimeout(self.timers.throttle[i]);
                    }, this.options.throttleDelay);
                }

            }.bind(this, index, state, active), delay);
        },

        expand: function(index, delay) {
            this.setState(index, delay, true);
        },

        collapse: function(index, delay) {
            this.setState(index, delay, false);
        }
    });

    return Dropdown;
});

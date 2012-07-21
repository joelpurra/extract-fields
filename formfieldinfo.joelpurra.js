/*!
 * @license FormFieldInfo
 * Copyright © 2012 Joel Purra <http://joelpurra.se/>
 * Released under MIT, BSD and GPL license. Comply with at least one.
 *
 * A jQuery wrapper/plugin for used to collect information about forms in a page.
 * This information is then used to filter out potential form problems, like missing
 * values for radio buttons etcetera.
 */

/*jslint white: true, browser: true*/
/*global jQuery*/

var JoelPurra = JoelPurra || {};

(function($, namespace) {

    var ns = namespace.FormFieldInfo = namespace.FormFieldInfo || {};

    ns.getAllFields = function() {
        var info = [];

        $(":input").each(function(index) {
            var $this = $(this);

            info.push({
                tag: this.tagName,
                id: this.id,
                name: this.name,
                value: this.value,
                visible: $this.is(":visible") === true,
                disabled: this.disabled === true,
                required: this.required === true
            });
        });

        return info;
    }

}(jQuery, JoelPurra));
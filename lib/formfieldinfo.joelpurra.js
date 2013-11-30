/*!
 * @license FormFieldInfo
 * Copyright © 2012, 2013 Joel Purra <http://joelpurra.com/>
 * Released under MIT, BSD and GPL license. Comply with at least one.
 *
 * https://github.com/joelpurra/formfieldinfo
 *
 * A javascript plugin used to collect information about forms in a page.
 */

/*jslint white: true, nomen: true, todo: true*/
/*global document: true, jQuery: true, _: true, JoelPurra: true */

var JoelPurra = JoelPurra || {};

(function(document, $, _, namespace) {
    "use strict";
    var ns = namespace.FormFieldInfo = namespace.FormFieldInfo || {},
        Field = function(element) {
            this.element = element;
            this.$element = $(element);

            this.tag = this.element.tagName;
            this.type = this.element.type;
            this.id = this.element.id;
            this.name = this.element.name;
            this.value = this.$element.val();
            this.visible = this.$element.is(":visible") === true;
            this.disabled = this.element.disabled === true;
            this.required = this.element.required === true;
            this.multiple = this.element.multiple === true;
        },
        fieldsMixins, fieldGroupsMixins;

    /**
     * Get all form fields on the page.
     * @param {String} [selector=":input"] A selector used to find form fields within $context.
     * @param {jQuery} [$context=$(document)] A context used to search for form fields.
     * @returns {Field[]} An array of Field# objects.
     */
    ns.getFields = function(selector, $context) {
        var fields = [];

        selector = selector || ":input";
        $context = $context || $(document);

        $context.find(selector).each(function() {
            fields.push(new Field(this));
        });

        return _(fields);
    };

    fieldsMixins = {

        /**
         * Groups fields based on their name.
         * @param {Field[]} [fields] An array of fields.
         * @returns {FieldGroup[]} An array of FieldGroup# objects.
         */
        groups: function(fields) {
            var groups = _(fields).groupBy("name");

            return _(groups);
        }

        ,
        /**
         * Gets fields based on their name.
         * @param {Field[]} fields An array of fields.
         * @param {String} name The name of the group of fields.
         * @returns {Field[]} An array of Field# objects with the same name.
         */
        group: function(fields, name) {
            var elementsWithTheSameName = _(fields).filter(function(element) {
                return element.name === name;
            });

            return _(elementsWithTheSameName);
        }

        ,
        /**
         * Removes fields with empty names.
         * @param {Field[]} fields An array of fields.
         * @returns {Field[]} An array of fields with names.
         */
        removeEmptyNames: function(fields) {
            var withNames = _(fields).filter(function(field) {
                return !!field.name;
            });

            return _(withNames);
        }

        ,
        /**
         * Gets an array of unique fields names.
         * @param {Field[]} fields An array of fields.
         * @returns {String[]} An array of unique field names.
         */
        uniqueNames: function(fields) {
            var names = _(fields).pluck("name");

            return _(names);
        }

        ,
        /**
         * Merges fields based on the array convention fieldName[0], fieldName[1], ..., fieldName[n] to fieldName[i]. The merge keeps the first instance of each unique fieldName[i] and discards the rest.
         * @param {Field[]} fields An array of fields.
         * @returns {Field[]} An array of Field# objects where all field arrays have been merged to fieldName[i].
         */
        mergeArrays: function(fields) {
            var discovered = {},
                merged = _(fields).filter(function(field) {
                    var indexerRx = /\[\d+\]/g,
                        mangledName;

                    if (indexerRx.test(field.name)) {
                        mangledName = field.name.replace(indexerRx, "[i]");

                        if (discovered[mangledName] === undefined) {
                            discovered[mangledName] = 1;

                            field.name = mangledName;

                            return true;
                        }

                        discovered[mangledName] += 1;

                        return false;
                    }

                    return true;
                });

            return _(merged);
        }
    };

    fieldGroupsMixins = {

        /**
         * Gets field names with a list of all corresponding values.
         * @param {FieldGroup[]} fieldGroups An array of fields groups.
         * @returns {FieldSummary[]} An array of FieldSummary objects.
         */
        nameValues: function(fieldGroups) {
            var groups = _(fieldGroups).map(function(value) {

                function getValues(fieldGroup) {
                    // Getting values while taking different tag types into consideration.
                    // Especially <select>, which has values in child <option>s.
                    var first = fieldGroup.first(),
                        $options, values;

                    if (first.$element.is("select")) {
                        $options = first.$element.find("option");
                        values = [];

                        $options.each(function() {
                            var $this = $(this),
                                value = $this.attr("value") || $this.text();

                            values.push(value);
                        });
                    } else {
                        values = fieldGroup.pluck("value");
                    }

                    return values;
                }

                var fieldGroup = _(value),
                    first = fieldGroup.first(),
                    // TODO: create a FieldSummary object based on fieldSummary.
                    fieldSummary = {
                        name: first.name,
                        tag: first.tag,
                        type: first.type,
                        values: getValues(fieldGroup)
                    };

                fieldSummary.multiple = first.multiple || (first.$element.is(":checkbox") && fieldGroup.size() > 1);
                fieldSummary.uniqueValues = _.uniq(fieldSummary.values);
                fieldSummary.hasDuplicateValues = fieldSummary.values.length !== fieldSummary.uniqueValues.length;

                return fieldSummary;
            });

            return _(groups);
        }

        ,
        /**
         * Gets field groups that have mismatched attributes within the groups. Attributes checked for mismatches are tag and type.
         * @param {FieldGroup[]} fieldGroups An array of fields groups.
         * @returns {FieldGroup[]} An array of FieldGroup objects that have mismatches.
         */
        withMismatches: function(fieldGroups) {
            var withMismatches = _(fieldGroups).filter(function(value) {
                var fieldsInGroup = _(value),
                    tags = _.uniq(fieldsInGroup.pluck("tag")),
                    types = _.uniq(fieldsInGroup.pluck("type")),
                    hasMismatches = _(tags).size() > 1 || _(types).size() > 1;

                return hasMismatches;
            }).map(function(value) {
                var fieldsInGroup = _(value),
                    first = fieldsInGroup.first(),
                    result = {
                        name: first.name,
                        tags: _.uniq(fieldsInGroup.pluck("tag")),
                        types: _.uniq(fieldsInGroup.pluck("type"))
                    };

                return result;
            });

            return _(withMismatches);
        }
    };

    // TODO: create a copy of underscore and add mixins locally only?
    _.mixin(fieldsMixins);
    _.mixin(fieldGroupsMixins);

}(document, jQuery, _, JoelPurra));
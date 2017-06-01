function addEvent(el, type, fn) {
    if (window.addEventListener) {
        el.addEventListener(type, fn, false);
    }
    else if (window.attachEvent) {
        el.attachEvent('on' + type, fn);
    }
    else {
        el['on' + type] = fn;
    }
}

// Constructor.
var Interface = function (name, methods) {
    if (arguments.length != 2) {
        throw new Error("Interface constructor called with " + arguments.length +
            "arguments, but expected exactly 2.");
    }
    this.name = name;
    this.methods = [];
    for (var i = 0, len = methods.length; i < len; i++) {
        if (typeof methods[i] !== 'string') {
            throw new Error("Interface constructor expects method names to be "
                + "passed in as a string.");
        }
        this.methods.push(methods[i]);
    }
};

// Static class method.
Interface.ensureImplements = function (object) {
    if (arguments.length < 2) {
        throw new Error("Function Interface.ensureImplements called with " +
            arguments.length + "arguments, but expected at least 2.");
    }
    for (var i = 1, len = arguments.length; i < len; i++) {
        var interface = arguments[i];
        if (interface.constructor !== Interface) {
            throw new Error("Function Interface.ensureImplements expects arguments"
                + "two and above to be instances of Interface.");
        }

        for (var j = 0, methodsLen = interface.methods.length; j < methodsLen; j++) {
            var method = interface.methods[j];
            if (!object[method] || typeof object[method] !== 'function') {
                throw new Error("Function Interface.ensureImplements: object "
                    + "does not implement the " + interface.name
                    + " interface. Method " + method + " was not found.");
            }
        }
    }
};

function extend(subClass, superClass) {
    var F = function () { };
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;
    subClass.superclass = superClass.prototype;
    if (superClass.prototype.constructor == Object.prototype.constructor) {
        superClass.prototype.constructor = superClass;
    }
}


var Composite = new Interface('Composite', ['add', 'remove', 'getChild']);

var FormItem = new Interface('FormItem', ['save']);


var CompositeForm = function (id, method, action) { // implements Composite, FormItem
    this.formComponents = [];
    this.element = document.createElement('form');
    this.element.id = id;
    this.element.method = method || 'POST';
    this.element.action = action || '#';
};

CompositeForm.prototype.add = function (child) {
    Interface.ensureImplements(child, Composite, FormItem);
    this.formComponents.push(child);
    this.element.appendChild(child.getElement());
};

CompositeForm.prototype.remove = function (child) {
    for (var i = 0, len = this.formComponents.length; i < len; i++) {
        if (this.formComponents[i] === child) {
            this.formComponents.splice(i, 1); // Remove one element from the array at
            // position i.
            break;
        }
    }
};

CompositeForm.prototype.getChild = function (i) {
    return this.formComponents[i];
};
CompositeForm.prototype.save = function () {
    for (var i = 0, len = this.formComponents.length; i < len; i++) {
        this.formComponents[i].save();
    }
};

CompositeForm.prototype.getElement = function () {
    return this.element;
};

var Field = function (id) { // implements Composite, FormItem
    this.id = id;
    this.element;
};

Field.prototype.add = function () { };

Field.prototype.remove = function () { };

Field.prototype.getChild = function () { };

Field.prototype.save = function () {
    setCookie(this.id, this.getValue);
};

Field.prototype.getElement = function () {
    return this.element;
};

Field.prototype.getValue = function () {
    throw new Error('Unsupported operation on the class Field.');
};


var InputField = function (id, label) { // implements Composite, FormItem
    Field.call(this, id);
    this.input = document.createElement('input');
    this.input.id = id;
    this.label = document.createElement('label');
    var labelTextNode = document.createTextNode(label);
    this.label.appendChild(labelTextNode);
    this.element = document.createElement('div');
    this.element.className = 'input-field';
    this.element.appendChild(this.label);
    this.element.appendChild(this.input);
};

extend(InputField, Field); // Inherit from Field.

InputField.prototype.getValue = function () {
    return this.input.value;
};


var TextareaField = function (id, label) { // implements Composite, FormItem
    Field.call(this, id);
    this.textarea = document.createElement('textarea');
    this.textarea.id = id;
    this.label = document.createElement('label');
    var labelTextNode = document.createTextNode(label);
    this.label.appendChild(labelTextNode);
    this.element = document.createElement('div');
    this.element.className = 'input-field';
    this.element.appendChild(this.label);
    this.element.appendChild(this.textarea);
};

extend(TextareaField, Field); // Inherit from Field.

TextareaField.prototype.getValue = function () {
    return this.textarea.value;
};

var SelectField = function (id, label) { // implements Composite, FormItem
    Field.call(this, id);
    this.select = document.createElement('select');
    this.select.id = id;
    this.label = document.createElement('label');
    var labelTextNode = document.createTextNode(label);
    this.label.appendChild(labelTextNode);
    this.element = document.createElement('div');
    this.element.className = 'input-field';
    this.element.appendChild(this.label);
    this.element.appendChild(this.select);
};

extend(SelectField, Field); // Inherit from Field.

SelectField.prototype.getValue = function () {
    return this.select.options[this.select.selectedIndex].value;
};

var contactForm = new CompositeForm('contact-form', 'POST', 'contact.php');
contactForm.add(new InputField('first-name', 'First Name'));
contactForm.add(new InputField('last-name', 'Last Name'));
contactForm.add(new InputField('address', 'Address'));
contactForm.add(new InputField('city', 'City'));
//var stateArray =[{'al', 'Alabama'}, ...];
//contactForm.add(new SelectField('state', 'State', stateArray));
contactForm.add(new InputField('zip', 'Zip'));
contactForm.add(new TextareaField('comments', 'Comments'));
addEvent(window, 'unload', contactForm.save);

var FormItem = new Interface('FormItem', ['save', 'restore']);

Field.prototype.restore = function () {
};

CompositeForm.prototype.restore = function () {
    for (var i = 0, len = this.formComponents.length; i < len; i++) {
        this.formComponents[i].restore();
    }
};

addEvent(window, 'load', contactForm.restore);

var CompositeFieldset = function (id, legendText) { // implements Composite, FormItem
    this.components = {};
    this.element = document.createElement('fieldset');
    this.element.id = id;
    if (legendText) { // Create a legend if the optional second
        // argument is set.
        this.legend = document.createElement('legend');
        this.legend.appendChild(document.createTextNode(legendText));
        this.element.appendChild(this.legend);
    }
};

CompositeFieldset.prototype.add = function (child) {
    Interface.ensureImplements(child, Composite, FormItem);
    this.components[child.getElement().id] = child;
    this.element.appendChild(child.getElement());
};

CompositeFieldset.prototype.remove = function (child) {
    delete this.components[child.getElement().id];
};

CompositeFieldset.prototype.getChild = function (id) {
    if (this.components[id] != undefined) {
        return this.components[id];
    }
    else {
        return null;
    }
};

CompositeFieldset.prototype.save = function () {
    for (var id in this.components) {
        if (!this.components.hasOwnProperty(id)) continue;
        this.components[id].save();
    }
};

CompositeFieldset.prototype.restore = function () {
    for (var id in this.components) {
        if (!this.components.hasOwnProperty(id)) continue;
        this.components[id].restore();
    }
};

CompositeFieldset.prototype.getElement = function () {
    return this.element;
};

var contactForm = new CompositeForm('contact-form', 'POST', 'contact.php');
var nameFieldset = new CompositeFieldset('name-fieldset');
nameFieldset.add(new InputField('first-name', 'First Name'));
nameFieldset.add(new InputField('last-name', 'Last Name'));
contactForm.add(nameFieldset);
var addressFieldset = new CompositeFieldset('address-fieldset');
addressFieldset.add(new InputField('address', 'Address'));
addressFieldset.add(new InputField('city', 'City'));
//addressFieldset.add(new SelectField('state', 'State', stateArray));
addressFieldset.add(new InputField('zip', 'Zip'));
contactForm.add(addressFieldset);
contactForm.add(new TextareaField('comments', 'Comments'));
body.appendChild(contactForm.getElement());
addEvent(window, 'unload', contactForm.save);
addEvent(window, 'load', contactForm.restore);
addEvent('save-button', 'click', nameFieldset.save);
addEvent('restore-button', 'click', nameFieldset.restore);

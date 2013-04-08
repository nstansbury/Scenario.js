"use strict";
/** @description A Natural Language BDD testing framework */
/** @author Neil Stansbury <neil@neilstansbury.com> */
/** @version 0.1 */


/** @param {String} title */
/** @static */
function SCENARIO(title){
	var scenario = new SCENARIO.Scenario(title, SCENARIO.Criteria);
	return scenario;
}

SCENARIO.logOnAssert = false;

/** @constructor */
SCENARIO.Scenario = function Scenario(title, criteriaSet){
	this.__assertions = [];
	this.__names = {};
	try {
		if(Object.keys(criteriaSet).length == 0){
			throw null;
		}
	}
	catch(e){
		console.log("No Criteria for Scenario :: '" +title +"'");
	}
	this.title = title;
	this.Criteria = criteriaSet || {};
}
SCENARIO.Scenario.prototype = {
	/** @private */
	/** @type Array */
	/** @description stack to store the order the criteria are asserted in */
	__assertions : null,
	
	/** @private */
	/** @type Object */
	/** @description Criteria names as index into assertions */
	__names : null,
	
	/** @type Number */
	defaultTimeout : 500,
	
	/** @type String */
	title : "",
	
	/** @param {Given.AssertionType} type */
	/** @param {String} name */
	/** @returns {Void} */
	addAssertion : function addAssertion(type, name){
		var assertion = new SCENARIO.Assertion(this, type, name);
		this.__assertions.push(assertion);
		this.__names[name] = this.__assertions.length -1;
	},
	
	/** @returns {SCENARIO.Iterator} */
	getAssertions : function(){
		return new SCENARIO.Iterator(this.__assertions);
	},
	
	/** @param {String} name */
	/** @returns {SCENARIO..Assertion} */
	getAssertion : function(name){
		var i = this.__names[name];
		if(i == undefined){
			throw("Assertion '" +name +"' is not implemented");
		}
		return this.__assertions[i];
	},
	
	/** @param {String} name */
	/** @param {Object} value */
	/** @returns {Void} */
	Assert : function assert(name, value){
		var assertion = this.getAssertion(name);
		assertion.assert(value);
	},
	
	/** @description Return the result of this assertion if it has been executed as a GIVEN */
	/** @param {String} name */
	/** @returns {Object|Boolean} */
	Given : function Given(name){
		var a = this.getAssertion(name);
		if(a.type != SCENARIO.AssertionType.Given){
			return false;
		}
		return a.result;
	},
	
	/** @description Return the result of this assertion if it has been executed as a WHEN */
	/** @param {String} name */
	/** @returns {Object|Boolean} */
	When : function When(name){
		var a = this.getAssertion(name);
		if(a.type != SCENARIO.AssertionType.When){
			return false;
		}
		return a.result;
	},
	
	/** @description Return the result of this assertion if it has been executed as a THEN */
	/** @param {String} name */
	/** @returns {Boolean} */
	Then : function Then(name){
		var a = this.getAssertion(name);
		if(a.type != SCENARIO.AssertionType.Then){
			return false;
		}
		return a.result;
	},
	
	/** @description Return whether this assertion has passed */
	/** @param {String} name */
	/** @returns {Boolean} */
	If : function If(name){
		return Boolean(this.getAssertion(name).result);
	},
	
	/** @description Return the result of this assertion */
	/** @param {String} name */
	/** @returns {Object} */
	The : function The(name){
		return this.getAssertion(name).result;
	},
	
	/** @param {String} criteria */
	/** @returns {SCENARIO.Scenario} */
	AND : function(criteria){
		// Check the last assertion type pushed onto the stack
		var last = this.__assertions[ this.__assertions.length -1 ];
		if(last.type != SCENARIO.AssertionType.When){
			this.GIVEN(criteria);
		}
		else if(last.type != SCENARIO.AssertionType.Then){
			this.WHEN(criteria);
		}
		else {
			this.THEN(criteria);
		}
		return this;
	},
	
	/** @param {String} criteria */
	/** @returns {SCENARIO.Scenario} */
	GIVEN : function(criteria){
		this.addAssertion(SCENARIO.AssertionType.Given, criteria);
		return this;
	},
	
	/** @param {String} criteria */
	/** @returns {SCENARIO.Scenario} */
	WHEN : function(criteria){
		this.addAssertion(SCENARIO.AssertionType.When, criteria);
		return this;
	},
	
	/** @param {String} criteria */
	/** @returns {SCENARIO.Scenario} */
	THEN : function(criteria){
		this.addAssertion(SCENARIO.AssertionType.Then, criteria);
		return this;
	},
	
	/** @returns {Void} */
	END  : function(timeout){
		timeout = timeout || this.defaultTimeout;
		
		var scenario = this;
		var assertion = null;
		var assertions = this.getAssertions();
		
		function endScenario(){
			timeout = -1;
			SCENARIO.Reporter.write(scenario);
		}
		
		function onassert(){
			if(timeout == -1){
				return;
			}
			assertion.onassert = null;			// Allows us to check whether a callback was made
			checkAssertion();
		}
		
		function checkAssertion(){
			while(assertions.hasMore()){
				assertion = assertions.getNext();
				assertion.onassert = onassert;		// We need to add a callback before invoking the assertion in case it asserts synchronously
				assertion.run();
				if(assertion.error){
					console.warn(assertion.toString());
				}
				else if(Boolean(assertion.result) == false){
					return;
				}
				assertion.onassert = null;
			}
		}
		
		timeout = setTimeout(endScenario, timeout);
		checkAssertion();
	},
	
	/** @param {Object} data */
	/** @param {Function} callback */
	/** @returns {Void} */
	/** @description To allow a web worker source file to postMessage() back to the caller */
	postMessage : function(data, callback){
		// Need to support dispatching as a formal event as well
		postMessage = callback;
		var messageEvent = {
			data : data,
			origin : "",
			source : null,
			lastEventId : "",
			ports : null
		}
		setTimeout(function(){onmessage.call(window, messageEvent)},1);
	}
}

/** @description Function definition for web worker postMessage() */ 
var postMessage = function postMessage(data){}

/** @description Function definition for web worker importScripts() */ 
var importScripts = function importScripts(script){
	console.warn("Web Worker 'importScripts()' is not yet implemented");
}


SCENARIO.AssertionType = {
	Given : 0,
	When : 1,
	Then : 2
}

/** @param {SCENARIO.Scenario} scenario */
/** @param {SCENARIO.AssertionType} type */
/** @param {Array} name */
/** @constructor */
SCENARIO.Assertion = function Assertion(scenario, type, name){
	this.__scenario = scenario;
	this.__functor = scenario.Criteria[name];
	this.name = name;
	this.type = type;
}
SCENARIO.Assertion.prototype = {
	/** @type SCENARIO.AssertionType */
	type : null,
	
	/** @type String */
	name : "",
	
	/** @type Object */
	result : false,
	
	/** @type Array */
	stack : null,
	
	/** @type Error */
	error : null,
	
	/** @returns {Void} */
	run : function(){
		try {
			// Chrome & Firefox format stack traces differently
			this.stack = new Error().stack.replace(/.*\(|.*@|Error\s|.*at\s|\)|\s,/gi, "").split("\n");
			
			// Assertion run in the scope of this Assertion object, and Scenario passed as an argument
			if(this.__functor){
				var result = this.__functor.call(this, this.__scenario);
			}
			else {
				var result  = false;
				console.warn("Assertion: '" +this.name +"' is not implemented");
			}
		}
		catch(e){
			var result  = false;
			this.error = e;
		}
		finally{
			this.result = result;
		}
	},
	
	assert : function(value){
		if(SCENARIO.logOnAssert){
			console.log("Asserting: '" +this.name +"' is " +(Boolean(value) ? "TRUE" : "FALSE"));	
		}
		this.result = value;
		if(this.onassert){
			this.onassert();
		}
	},
	
	/** @type Function */
	onassert : null,
	
	/** @returns {String} */
	toString : function(){
		switch(this.type){
			case SCENARIO.AssertionType.Given:
				var type = "GIVEN '";
				break;
			case SCENARIO.AssertionType.When:
				var type = "WHEN '";
				break;
			case SCENARIO.AssertionType.Then:
				var type = "THEN '";
		}
		
		var file = "";
		if(!this.stack){
			var result = "FAILED: Assertion was not tested";
		}
		else {
			if(Boolean(this.result)){
				var result = "PASSED";
			}
			else if(this.error){
				var result = "FAILED: " +this.error;
			}
			else if(this.onassert){
				var result = "FAILED: Asynchronous assertion never completed";
			}
			file = "\n" +this.stack[this.stack.length -1];
		}
		return type +this.name +"'\n" +result +file;
	}
}



/** @param {Array} array */
/** @constructor */
SCENARIO.Iterator = function Iterator(array){
	this.__array = array || [];
    this.__index = 0;
}
SCENARIO.Iterator.prototype = {
	/** @returns {Boolean} */
    hasMore: function() { return this.__index < this.__array.length; },
	/** @returns {Object} */
    getNext: function () { return ( this.__index < this.__array.length ) ? this.__array[this.__index++] : null; }
}

/** @param {String|Array} scenarios */
SCENARIO.run = function run(scenarios){
	scenarios = new SCENARIO.Iterator(Array.isArray(scenarios) ? scenarios : [scenarios]);
	
	function onloadscript()	{
		console.log("Loaded Scenario :: " +this.src);
		nextScenario();
	}
	
	function nextScenario(){
		while(scenarios.hasMore()){
			var scenario = scenarios.getNext();
			
			var head = document.getElementsByTagName("HEAD")[0];
			var script = document.createElement("SCRIPT");
			script.type = "text/javascript";
			script.src = scenario;
			script.addEventListener("load", onloadscript, false);
			head.appendChild(script);
			return;
		}
	}
	nextScenario();
}

/** @param {String} script */
SCENARIO.require = function require(script){
	// TBI
}

/** @constructor */
SCENARIO.Reporter = {
	/** @param {SCENARIO.Scenario} scenario */
	write : function(scenario){
		var stringBuilder = [];
		var result = true;
		var g = "GIVEN", w = "\n\t\tWHEN", t = "\n\t\t\tTHEN", statement = "";
		
		var assertions = scenario.getAssertions();
		while(assertions.hasMore()){
			var assertion = assertions.getNext();
			switch(assertion.type){
				case SCENARIO.AssertionType.Given:
					statement = g;
					g = "\n\tAND";
					break;
				case SCENARIO.AssertionType.When:
					statement = w;
					w = "\n\t\t\tAND";
					break;
				case SCENARIO.AssertionType.Then:
					statement = t;
					t = "\n\t\t\t\tAND";
					break;
			}
			stringBuilder.push(statement);
			stringBuilder.push(assertion.name);
			result = (result == false) ? false : assertion.result;
		}
		console.log("SCENARIO: " +scenario.title);
		stringBuilder.push(result ? "\nPASSED" : "\nFAILED");
		console.log("\t" +stringBuilder.join(" "));
	}
}

SCENARIO.HTMLReporter = function HTMLReporter(){
	
}
SCENARIO.HTMLReporter.prototype = {
	__proto__ : SCENARIO.Reporter,
	write : function(scenario){
		
		var ol = document.getElementById("gResults");
		if(!ol){
			ol = document.createElement("OL");
			ol.id = "gResults";
			document.body.appendChild(ol);
		}
		var li = document.createElement("LI");
		ol.appendChild(li);
		
		var h2 = document.createElement("H2");
		h2.innerHTML = scenario.title;
		li.appendChild(h2);

		var stringBuilder = [];
		var g = "GIVEN", w = "WHEN", t = "THEN", statement = "";
		
		var assertions = scenario.getAssertions();
		while(assertions.hasMore()){
			var assertion = assertions.getNext();
			switch(assertion.type){
				case SCENARIO.AssertionType.Given:
					statement = g;
					g = "AND";
					break;
				case SCENARIO.AssertionType.When:
					statement = w;
					w = "AND";
					break;
				case SCENARIO.AssertionType.Then:
					statement = t;
					t = "AND";
					break;
			}
			
			var span = document.createElement("SPAN");
			span.innerHTML = statement +" " +assertion.name;
			if(!Boolean(assertion.result)){
				span.setAttribute("class", "failed");
			}
			li.appendChild(span);
		}
	}
}

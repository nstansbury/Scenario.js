"use strict";
/** @description A Natural Language BDD testing framework */
/** @author Neil Stansbury <neil@neilstansbury.com> */
/** @version 0.1 */


/** @param {String} title */
/** @static */
function SCENARIO(title){
	return new SCENARIO.Scenario(title, SCENARIO.Criteria);
}

/** @type Boolean */
SCENARIO.logOnAssert = false;

/** @type Number */
SCENARIO.defaultTimeout = 500;

/** @type Boolean */
SCENARIO.isIdling = false;

SCENARIO.__scenarios =[];

/** @param {String|Array} scenarios */
/** @returns {Void} */
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
		}
	}
	nextScenario();
}

/** @param {SCENARIO.Scenario} scenario */
/** @returns {Void} */
SCENARIO.end = function end(scenario){
	if(!scenario){
		return;		// End of blocked scenarios
	}
	if(SCENARIO.isIdling){
		// Push this scenario on to the stack until we're unblocked
		SCENARIO.__scenarios.push(scenario);
		return;
	}
	
	function endScenario(){
		clearTimeout(timeout);
		timeout = null;
		SCENARIO.Reporter.write(scenario);
		SCENARIO.isIdling = false;
		SCENARIO.end(SCENARIO.__scenarios.shift());
	}
	
	var assertion = null;
	var assertions = scenario.getAssertions();
	
	function onassert(){
		if(timeout == null){
			return;
		}
		if(assertionPassed()){
			testAssertions();	// we can test the next assertion
		}
	}
	
	function assertionPassed(){
		if(assertion.error){
			console.warn(assertion.toString());
			endScenario();
			return false;
		}
		else if(Boolean(assertion.result) == false){
			// Going async on assertion should we idle?
			SCENARIO.isIdling = SCENARIO.isIdling ? SCENARIO.isIdling : scenario.idling;
			return false;
		}
		else{
			return true;	
		}
	}
	
	function testAssertions(){
		while(assertions.hasMore()){
			assertion = assertions.getNext();
			assertion.onassert = onassert;
			assertion.run();
			if(assertionPassed() == false){
				return;
			}
		}
	}
	
	var timeout = setTimeout(endScenario, scenario.timeout);
	testAssertions();
}

/** @param {String} script */
/** @returns {Void} */
SCENARIO.require = function require(script){
	// TBI
}

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
		console.warn("No Criteria for Scenario :: '" +title +"'");
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
	
	/** @type Boolean */
	/** @description All scenarios are asynchronous by default. Idling causes Scenarios to block on END() until completed */
	idling : false,
	
	/** @type Number */
	timeout : SCENARIO.defaultTimeout,
	
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
	Get : function Get(name){
		var result = this.getAssertion(name).result;
		if(result == undefined){
			throw("Assertion '" +name +"' result is not valid");
		}
		return result;
	},
	
	/** @returns {Void} */
	Idle  : function(){
		this.idling = true;
	},
	
	/** @param {String} criteria */
	/** @returns {SCENARIO.Scenario} */
	AND : function(criteria){
		// Check the last assertion type pushed onto the stack
		var last = this.__assertions[ this.__assertions.length -1 ];
		if(last.type == SCENARIO.AssertionType.Given){
			this.GIVEN(criteria);
		}
		else if(last.type == SCENARIO.AssertionType.When){
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
	END  : function(){
		SCENARIO.end(this);
	},
	
	
	/** @param {Object} data */
	/** @param {Function} callback */
	/** @returns {Void} */
	/** @description To allow a web worker source file to postMessage() back to the caller */
	postMessage : function(data, callback){
		// Need to support dispatching as a formal event as well
		var restore = postMessage;
		postMessage = function(e){
			postMessage = restore;
			callback(e);
		}
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
	console.info("Web Worker 'importScripts()' is not yet implemented");
}


SCENARIO.AssertionType = {
	Given : 1,
	When : 2,
	Then : 3
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
	stack : [],
	
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
				this.error = "Assertion: '" +this.name +"' is not implemented";
			}
		}
		catch(e){
			var result  = false;
			this.error = e;
		}
		finally{
			this.result = result;
			if(this.error){
				console.warn(this.error);
			}
		}
	},
	
	assert : function(value){
		if(SCENARIO.logOnAssert){
			console.log("Asserting: '" +this.name +"' is " +(Boolean(value) ? "TRUE" : "FALSE"));	
		}
		if(this.result){
			throw "Assertion Failed : Attempting to re-assert a result for '" +this.name +"'";
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
			else {
				var result = "FAILED: Assertion was false";
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
	isEmpty: function(){ return (this.__array.length == 0) ? true : false; },
	/** @returns {Boolean} */
    hasMore: function() { return this.__index < this.__array.length; },
	/** @returns {Object} */
    getNext: function () { return ( this.__index < this.__array.length ) ? this.__array[this.__index++] : null; }
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
		
		function getHtmlResult(template, params){
			for(var key in params)	{
				template = template.replace("{" +key +"}", params[ key ]);
			}
			return template;
		}
		
		var htmlScenario = "<dt {result}>{title}</dt><dd>{criteriaList}</dd>";
		var htmlCriteriaList = "<dl>{givens}</dl><dl>{whens}</dl><dl>{thens}</dl>";
		var htmlCriteria = "<dt {result}>{statement} '{title}'</dt><dd>{error} {file}</dd>";
		
		var result = true;
		var lastType = 0;
		var statement = "";
		var criteria = {}
		criteria[ SCENARIO.AssertionType.Given ] = [];
		criteria[ SCENARIO.AssertionType.When ] = [];
		criteria[ SCENARIO.AssertionType.Then ] = [];
		
		var assertions = scenario.getAssertions();
		
		while(assertions.hasMore()){
			var assertion = assertions.getNext();
			if(assertion.type == lastType){
				statement = "AND";
			}
			else if(assertion.type == SCENARIO.AssertionType.Given) {
				statement = "GIVEN";
			}
			else if(assertion.type == SCENARIO.AssertionType.When) {
				statement = "WHEN";
			}
			else {
				statement = "THEN";
			}
			
			result = (result) ? Boolean(assertion.result) : result;
			var file = assertion.stack[assertion.stack.length -1]
			if(!result){
				if(file == undefined){
					var error = "FAILED: Assertion was not tested";
					file = "";
				}
				else {
					var error = "FAILED: " +(assertion.error || "Assertion was 'false'")
				}
			}
			else {
				var error = "PASSED";
			}
			
			var params = {
				statement : statement,
				title : assertion.name,
				result : result ? "" : "data-failed",
				error : error,
				file : file
			}
			
			var html = getHtmlResult(htmlCriteria, params);
			criteria[assertion.type].push(html);
			lastType = assertion.type;
		}
		
		if(assertions.isEmpty()){
			result = false;
			var criteriaList = "FAILED: No criteria specified";
		}
		else {
			var params = {
				givens : criteria[SCENARIO.AssertionType.Given].join(""),
				whens : criteria[SCENARIO.AssertionType.When].join(""),
				thens : criteria[SCENARIO.AssertionType.Then].join("")
			}
			var criteriaList = getHtmlResult(htmlCriteriaList, params);	
		}
		
		params = {
			title : scenario.title,
			result : result ? "" : "data-failed",
			criteriaList : criteriaList
		}
		
		var dl = document.createElement("DL");
		dl.innerHTML = getHtmlResult(htmlScenario, params);
		document.body.appendChild(dl);
	}
}

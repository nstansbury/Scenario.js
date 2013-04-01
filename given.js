"use strict";
/** @author Neil Stansbury <neil@neilstansbury.com> */
/** @version 0.1 */


/** @param {String} name */
/** @static */
function GIVEN(name){
	var scenario = new GIVEN.Scenario(GIVEN.Criteria);
	scenario.title = GIVEN.title;
	return scenario.GIVEN(name);
}

/** @type Number */
GIVEN.defaultTimeout = 500;

GIVEN.version = 0.1;

/** @type String */
GIVEN.title = "";

/** @constructor */
GIVEN.Scenario = function Scenario(criteriaSet){
	this.__assertions = [];
	this.__names = {};
	this.Criteria = criteriaSet;
}
GIVEN.Scenario.prototype = {
	/** @private */
	/** @type Array */
	/** @description stack to store the order the criteria are asserted in */
	__assertions : null,
	
	/** @private */
	/** @type Object */
	/** @description Criteria names as index into assertions */
	__names : null,
	
	/** @type String */
	title : "",
	
	/** @param {Given.Assertion} assertion */
	/** @returns {Object} */
	hasAssertion : function hasAssertion(assertion){
		var f = this.Criteria[assertion.name];
		try {
			if(!f){
				throw "Assertion is not defined";
			}
			assertion.result = f.call(this);				// Criteria asserted in the scope of this Scenario
			if(assertion.result == undefined) {
				assertion.result = false;
			}
		}
		catch(e){
			assertion.result = false;
			console.log("Assertion Failed: '" +assertion.name +"' :: " +e);
		}
		return assertion.result;
	},
	
	/** @param {Given.AssertionType} type */
	/** @param {String} name */
	/** @returns {Void} */
	addAssertion : function addAssertion(type, name){
		var assertion = {
			type : type,
			name : name,
			result : false,
			onassert : null,
		}
		this.__assertions.push(assertion);
		this.__names[name] = this.__assertions.length -1;
	},
	
	/** @returns {GIVEN.Iterator} */
	getAssertions : function(){
		return new GIVEN.Iterator(this.__assertions);
	},
	
	/** @param {String} name */
	/** @returns {GIVEN.Assertion} */
	getAssertion : function(name){
		var i = this.__names[name];
		return this.__assertions[i];
	},
	
	/** @param {String} name */
	/** @param {Object} result */
	/** @returns {Void} */
	Assert : function assert(name, result){
		var assertion = this.getAssertion(name);
		if(!assertion){
			throw "Assertion is not defined :: " +name;
		}
		assertion.result = result;
		if(assertion.onassert){
			assertion.onassert();
		}
	},
	
	/** @param {String} name */
	/** @returns {Object|Boolean} */
	Given : function Given(name){
		var a = this.getAssertion(name);
		if(a.type != GIVEN.AssertionType.Given){
			return false;
		}
		return a.result;
	},
	
	/** @param {String} name */
	/** @returns {Object|Boolean} */
	When : function When(name){
		var a = this.getAssertion(name);
		if(a.type != GIVEN.AssertionType.When){
			return false;
		}
		return a.result;
	},
	
	/** @param {String} name */
	/** @returns {Boolean} */
	Then : function Then(name){
		var a = this.getAssertion(name);
		if(a.type != GIVEN.AssertionType.Then){
			return false;
		}
		return a.result;
	},
	
	/** @param {String} name */
	/** @returns {Boolean} */
	/** @description A naughty piece of sweet syntactic sugar */
	If : function Then(name){
		return Boolean(this.getAssertion(name).result);
	},
	
	/** @param {String} criteria */
	/** @returns {GIVEN.Scenario} */
	AND : function(criteria){
		// Check the last assertion type pushed onto the stack
		var last = this.__assertions[ this.__assertions.length -1 ];
		if(last.type != GIVEN.AssertionType.When){
			this.GIVEN(criteria);
		}
		else if(last != GIVEN.AssertionType.Then){
			this.WHEN(criteria);
		}
		else {
			this.THEN(criteria);
		}
		return this;
	},
	
	/** @param {String} criteria */
	/** @returns {GIVEN.Scenario} */
	GIVEN : function(criteria){
		this.addAssertion(GIVEN.AssertionType.Given, criteria);
		return this;
	},
	
	/** @param {String} criteria */
	/** @returns {GIVEN.Scenario} */
	WHEN : function(criteria){
		this.addAssertion(GIVEN.AssertionType.When, criteria);
		return this;
	},
	
	/** @param {String} describe */
	/** @returns {GIVEN.Scenario} */
	THEN : function(criteria){
		this.addAssertion(GIVEN.AssertionType.Then, criteria);
		return this;
	},
	
	/** @returns {Void} */
	END  : function(timeout){
		timeout = timeout || GIVEN.defaultTimeout;
		
		var scenario = this;
		var assertion = null;
		var assertions = this.getAssertions();
		
		function endScenario(){
			timeout = -1;
			GIVEN.Reporter.write(scenario);
		}
		
		function onassert(){
			if(timeout == -1){
				return;
			}
			if(assertion.result == false){
				endScenario();
			}
			else {
				checkAssertion();
			}
		}
		
		function checkAssertion(){
			while(assertions.hasMore()){
				assertion = assertions.getNext();
				var result = scenario.hasAssertion(assertion);
				if(!result){
					assertion.onassert = onassert;
					return;
				}
			}
		}
		
		timeout = setTimeout(endScenario, timeout);
		checkAssertion();
	}
}

GIVEN.AssertionType = {
	Given : 0,
	When : 1,
	Then : 2
}

GIVEN.Assertion = {
	/** @type GIVEN.AssertionType */
	type : null,
	
	/** @type String */
	name : "",
	
	/** @type Object|Boolean */
	result : null
}

/** @param {Array} array */
/** @constructor */
GIVEN.Iterator = function Iterator(array){
	this.__array = array || [];
    this.__index = 0;
}
GIVEN.Iterator.prototype = {
	/** @returns {Boolean} */
    hasMore: function() { return this.__index < this.__array.length; },
	/** @returns {Object} */
    getNext: function () { return ( this.__index < this.__array.length ) ? this.__array[this.__index++] : null; }
}

/** @constructor */
GIVEN.Reporter = {
	/** @param {GIVEN.Scenario} scenario */
	write : function(scenario){
		var stringBuilder = [];
		var result = true;
		var g = "GIVEN", w = "\n\t\tWHEN", t = "\n\t\t\tTHEN", statement = "";
		
		var assertions = scenario.getAssertions();
		while(assertions.hasMore()){
			var assertion = assertions.getNext();
			switch(assertion.type){
				case GIVEN.AssertionType.Given:
					statement = g;
					g = "\n\tAND";
					break;
				case GIVEN.AssertionType.When:
					statement = w;
					w = "\n\t\t\tAND";
					break;
				case GIVEN.AssertionType.Then:
					statement = t;
					t = "\n\t\t\t\tAND";
					break;
			}
			stringBuilder.push(statement);
			stringBuilder.push(assertion.name);
			result = (result == false) ? false : assertion.result;
		}
		console.log(scenario.title);
		stringBuilder.push(result ? "\nPASSED" : "\nFAILED");
		console.log("\t" +stringBuilder.join(" "));
	}
}

GIVEN.HTMLReporter = function HTMLReporter(){
	
}
GIVEN.HTMLReporter.prototype = {
	__proto__ : GIVEN.Reporter,
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
				case GIVEN.AssertionType.Given:
					statement = g;
					g = "AND";
					break;
				case GIVEN.AssertionType.When:
					statement = w;
					w = "AND";
					break;
				case GIVEN.AssertionType.Then:
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

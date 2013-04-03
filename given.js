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
	
	/** @param {Given.Assertion} assertion */
	/** @returns {Object} */
	hasAssertion : function hasAssertion(assertion){
		try {
			var f = this.Criteria[assertion.name];
			if(!f){
				throw "Assertion is not defined";
			}
			// Criteria asserted in the scope of this Scenario, and passed in as an argument as a convienience for callbacks
			assertion.result = f.call(this, this);
			if(assertion.result == undefined) {
				assertion.result = false;
			}
		}
		catch(e){
			assertion.result = false;
			if(Object.keys(this.Criteria).length != 0){
				console.log("Assertion Failed: '" +assertion.name +"' :: " +e);
			}	
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
	
	/** @returns {SCENARIO.Iterator} */
	getAssertions : function(){
		return new SCENARIO.Iterator(this.__assertions);
	},
	
	/** @param {String} name */
	/** @returns {SCENARIO..Assertion} */
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
		else if(last != SCENARIO.AssertionType.Then){
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

SCENARIO.AssertionType = {
	Given : 0,
	When : 1,
	Then : 2
}

SCENARIO.Assertion = {
	/** @type SCENARIO.AssertionType */
	type : null,
	
	/** @type String */
	name : "",
	
	/** @type Object|Boolean */
	result : null
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
		console.log(scenario.title);
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

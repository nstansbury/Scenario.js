Given.js
========

A natural language BDD testing framework for JavaScript:

```javascript
SCENARIO("Description").GIVEN("criteria").WHEN("criteria").THEN("criteria").AND("criteria").END();
```

It is designed so that the BDD scenarios can be written directly by BAs or developers in a natural language syntax that can be directly executed in any JavaScript environment.

The BDD scenarios can be defined and executed separately from individual scenario criteria implemented by the developers.

Each criteria is executed as a self-contained assertion, allowing developers to reuse the criteria across multiple scenarios in the same story or feature file. This allows a more natural OO coding style, with a consistant scope that doesn't rely on multiple nested closures.

Any combination of GIVENs, WHENs, THENs & ANDs can be chanined together, which are automatically executed asynchronously if 'false' is returned from the assertion. The scenario will wait for the assertion to become "truthy" or the test will fail.

As the context of an assertion is always that of its' current scenario, the state and values of previous assertions in the scenario chain can be accessed using a 'Given/When/Then/The/If(criteria)' syntax:

```javascript
scenario.Given("criteria");	// Return the result of this assertion if it has been executed as a GIVEN
scenario.When("criteria");	// Return the result of this assertion if it has been executed as a WHEN
scenario.Then("criteria");	// Return the result of this assertion if it has been executed as a THEN
scenario.The("criteria");	// Return the result of this assertion however it was been executed
scenario.If("criteria");	// Has this assertion passed
```

Callbacks can assert a specific value asynchronously as if returned from the original assertion call:
```javascript
scenario.Assert("criteria", value);	// Assert a specific value against this criteria
```

Finally, END() takes an optional test timeout argument in m/s.


```javascript
// BDD Scenarios

SCENARIO.Reporter = new SCENARIO.HTMLReporter();


SCENARIO("Check a loaded event occurs when the page loads").
	GIVEN("a web page").
		WHEN("it is loaded").
			THEN("a document loaded event occurs").
END();


SCENARIO("Check an unloaded event occurs when the page unloads").
	GIVEN("a web page").
		AND("it is loaded").
			WHEN("it is unloaded").
				THEN("a document unloaded event occurs").
END();

```


```javascript
// Scenario Criteria

SCENARIO.Criteria = {
	"a web page" : function(){
		return window.document;
	},
	
	"it is loaded" : function(scenario){
		function event(){
			scenario.Assert("it is loaded", true);
		}
		this.Given("a web page").addEventListener("DOMContentLoaded", event, false);
		return false;
	},
	
	"a document loaded event occurs" : function(){
		return this.If("it is loaded");
	},
	
	"it is unloaded" : function(){
		return this.If("it is unloaded");
	},
	
	"a document unloaded event occurs" : function(scenario){
		function event(){
			scenario.Assert("it is unloaded", true);
		}
		this.Given("a web page").addEventListener("unloaded", event, false);
		return false;
	}
}

```

You can return any value or object in an assertion as long as it evaluates to "truthy". Though try to resist the tempation to return multiple objects in an assertion for the sake of it. It makes for more expressive & reusable tests to chain multiple GIVENS (or WHENs/THENs):

```javascript
// Avoid this:

SCENARIO("Check two things equal each other").
	GIVEN("Two things").
		THEN("ThingA should equal ThingB").
END();

SCENARIO.Criteria = {
	"Two things" : function(){
		return {
			thingA : new ThingA(),
			thingB : new ThingB()
		}
	},
	
	"Thing A should equal thing B" : function(){
		return this.Given("Two things").thingA == this.Given("Two things").thingB;
	}
}


// Opt for this instead

SCENARIO("Check two things equal each other").
	GIVEN("ThingA").
		AND("ThingB").
			THEN("ThingA should equal ThingB").
END();

SCENARIO.Criteria = {
	"ThingA" : function(){
		return new ThingA();
	},
	"ThingB" : function(){
		return new ThingB();
	},
	"Thing A should equal thing B" : function(){
		return this.Given("ThingA") == this.Given("ThingB");
	}
}
```

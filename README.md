Given.js
========

A natural language BDD testing framework for JavaScript.

It is designed so that the BDD scenarios can be written directly by BAs in a natural language structure and be managed and executed separately from individual scenario criteria implemented by the developers.

```javascript
GIVEN.Reporter = new GIVEN.HTMLReporter();

GIVEN("A Car").
	AND("an ignition key").
	AND("there is fuel in the car").
		WHEN("the key is turned in the ignition").
			THEN("the engine starts").
			AND("it makes a Vroom Vroom noise").
END();
```

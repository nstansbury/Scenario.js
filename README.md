Given.js
========

A natural language BDD testing framework for JavaScript:


GIVEN.Reporter = new GIVEN.HTMLReporter();

GIVEN("A Car").
	AND("an ignition key").
	AND("there is fuel in in the car").
		WHEN("the key is turned in the ignition").
			THEN("the engine starts").
			AND("it makes a Vroom Vroom noise").
			END();

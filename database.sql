DROP TABLE IF EXISTS Faxes;
CREATE TABLE Faxes (
	FaxID TEXT,
	TelnyxID TEXT,
	Recipient TEXT,
	Status TEXT,
	Initiated INT,
	Updated INT,
	PRIMARY KEY (`FaxID`)
);

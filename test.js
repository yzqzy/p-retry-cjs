const pRetry = require("./dist/index").default;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
	let i = 0;

	const run = async () => {
		await delay(3000);

		if (i < 3) {
			i += 1;
			throw new AbortError("failed");
		}

		return "success";
	};

	console.log(await pRetry(run, { retries: 5 }));
})();

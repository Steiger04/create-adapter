import { translateText } from "@iobroker/adapter-dev/build/translate";
import { composeObject } from "alcalzone-shared/objects";
import * as JSON5 from "json5";
import { licenses } from "../src/lib/core/licenses";
import { AdapterSettings, getDefaultAnswer, getIconName } from "../src/lib/core/questions";
import type { TemplateFunction } from "../src/lib/createAdapter";

export = (async answers => {

	const isAdapter = answers.features.indexOf("adapter") > -1;
	const isWidget = answers.features.indexOf("vis") > -1;
	const useTypeScript = answers.language === "TypeScript";
	const useJsonConfig = answers.adminUi === "json";
	const useAdminReact = answers.adminUi === "react";
	const useTabReact = answers.tabReact === "yes";
	const useReact = useAdminReact || useTabReact;
	const supportCustom = answers.adminFeatures && answers.adminFeatures.indexOf("custom") > -1;
	const supportTab = answers.adminFeatures && answers.adminFeatures.indexOf("tab") > -1;
	const defaultBranch = answers.defaultBranch || "main";

	const languages = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "zh-cn"];

	const title: string = answers.title || answers.adapterName;
	const titleLang = JSON.stringify(
		composeObject(await Promise.all(
			languages.map(async lang => [lang, await translateText(title, lang)] as [string, string]),
		)),
	);

	const description: string = answers.description || answers.adapterName;
	const descriptionLang = JSON.stringify(
		composeObject(await Promise.all(
			languages.map(async lang => [lang, await translateText(description, lang)] as [string, string]),
		)),
	);

	const allSettings: AdapterSettings[] = answers.adapterSettings || getDefaultAnswer("adapterSettings")!;
	const adapterSettings: Record<string, any> = {};
	for (const setting of allSettings) {
		adapterSettings[setting.key] = setting.defaultValue;
	}

	let adminUiConfig: string;
	switch (answers.adminUi) {
		case "react":
		case "html":
			adminUiConfig = "materialize";
			break;
		case "json":
			adminUiConfig = "json";
			break;
		default:
			adminUiConfig = "none";
			break;
	}

	const template = `
{
	"common": {
		"name": "${answers.adapterName}",
		"version": "0.0.1",
		"news": {
			"0.0.1": {
				"en": "initial release",
				"de": "Erstveröffentlichung",
				"ru": "Начальная версия",
				"pt": "lançamento inicial",
				"nl": "Eerste uitgave",
				"fr": "Première version",
				"it": "Versione iniziale",
				"es": "Versión inicial",
				"pl": "Pierwsze wydanie",
				"zh-cn": "首次出版"
			}
		},
		"title": "${title}",
		"titleLang": ${titleLang},
		"desc": ${descriptionLang},
		"authors": [
			"${answers.authorName} <${answers.authorEmail}>"
		],
		"keywords": ${JSON.stringify(answers.keywords || getDefaultAnswer("keywords"))},
		"license": "${licenses[answers.license!].id}",
		"platform": "Javascript/Node.js",
		"main": "${useTypeScript ? "build/" : ""}main.js",
		"icon": "${getIconName(answers)}",
		"enabled": true,
		"extIcon": "https://raw.githubusercontent.com/${answers.authorGithub}/ioBroker.${answers.adapterName}/${defaultBranch}/admin/${getIconName(answers)}",
		"readme": "https://github.com/${answers.authorGithub}/ioBroker.${answers.adapterName}/blob/${defaultBranch}/README.md",
		"loglevel": "info",
		${isWidget ? (`
			"restartAdapters": ["vis"],
			"localLinks": {"_default": "%web_protocol%://%ip%:%web_port%/vis/edit.html"},
		`) : ""}
		${isAdapter ? (`
			"mode": "${answers.startMode || "daemon"}",
			${answers.scheduleStartOnChange === "yes" ? (`
				"allowInit": true,
			`) : ""}
			"type": "${answers.type || "general"}",
			"compact": true,
			${!!answers.connectionType ? (`
				"connectionType": "${answers.connectionType}",
			`) : ""}
			${!!answers.dataSource ? (`
				"dataSource": "${answers.dataSource}",
			`) : ""}
		`) : isWidget ? (`
			"onlyWWW": true,
			"noConfig": true,
			"singleton": true,
			"type": "${answers.type || "visualization-widgets"}",
			"mode": "once",
		`) : ""}
		${isAdapter ? `
		"adminUI": {
			"config": "${adminUiConfig}",
			${supportTab ? `"tab": "materialize",` : ""}
		},` : ""}
		${supportTab ? (`
		"adminTab": {
			"singleton": true,
			"name": ${titleLang},
			"link": "",
			"fa-icon": "info",
		},
		`) : ""}
		${supportCustom ? `"supportCustoms": true,` : ""}
		${useReact ? `"eraseOnUpload": true,` : ""}
		"dependencies": [
			${isAdapter ? `{ "js-controller": ">=3.3.22" },` : ""}
			${isWidget ? `"vis",` : ""}
		],
		"globalDependencies": [
			${isAdapter ? `{ "admin": "${useJsonConfig ? ">=5.1.13" : ">=5.0.0" }" },` : ""}
		],
	},
	"native": ${JSON.stringify(adapterSettings)},
	"objects": [
	],
	"instanceObjects": [
		${answers.connectionIndicator === "yes" ? `{
			"_id":  "info",
			"type": "channel",
			"common": {
				"name": "Information"
			},
			"native": {}
		},
		{
			"_id": "info.connection",
			"type": "state",
			"common": {
				"role": "indicator.connected",
				"name": "Device or service connected",
				"type": "boolean",
				"read": true,
				"write": false,
				"def": false
			},
			"native": {}
		},` : ""}
	],
}`;
	return JSON.stringify(JSON5.parse(template), null, 4);
}) as TemplateFunction;


	function processClrText (row) {
		var match = false;
		if(row.match(/DoBallRemove::bracketMgr ([^\s]*)/)) {
			//delete overview[parseInt(row.match(/DoBallRemove::bracketMgr ([^\s]*)/)[1])];
			//delete fittings[parseInt(row.match(/DoBallRemove::bracketMgr ([^\s]*)/)[1])];
			updateFittings("remove", parseInt(row.match(/DoBallRemove::bracketMgr ([^\s]*)/)[1]));
			updateOverview("remove", parseInt(row.match(/DoBallRemove::bracketMgr ([^\s]*)/)[1]));
		} else if(row.match(/DoBallRemove::state ([^\s]*)/)) {
			//delete overview[parseInt(row.match(/DoBallRemove::state ([^\s]*)/)[1])];
			//delete fittings[parseInt(row.match(/DoBallRemove::state ([^\s]*)/)[1])];
			updateFittings("remove", parseInt(row.match(/DoBallRemove::state ([^\s]*)/)[1]))
			updateOverview("remove", parseInt(row.match(/DoBallRemove::state ([^\s]*)/)[1]));
		} else if(row.match(/Sending 'OnBracketCreated' message to ([^\s]*)/)) {
			var res = {};
			var data = row.match(/<slimItem: (.+?)>/);
			if(data) {
				data = data[1].split(",");
				for(var d in data) {
					var tmpobj = data[d].split("=");
					if(bracketheaders.indexOf(tmpobj[0]) >= 0) {
						res[tmpobj[0]] = tmpobj[1];
					}
					if(tmpobj[0] == "modules") {
						var mods = row.match(/\[(\((.+?)\))\]/);
						if(!mods) continue;
						mods = mods[0];
						mods = mods.match(/\((.+?)\)/g);
						for(var m in mods) {
							var mod = mods[m].substr(1, mods[m].length - 2).split(",");
							addToFit(res.itemID, parseInt(mod[0]), parseInt(mod[1]), false, parseInt(mod[2]));
						}
					}
				}
				overview[res.itemID] = res;
				updateOverview("add", res);
			}
		}
	}

	function processData (obj) {
		if(obj && typeof obj == "object") {
			if(obj[0] && obj[0][0] && obj[0][0][0] && obj[0][0][0][0] == "curSolarsystemid2") { // system switch
				console.log("switch");

				curSolarSystemID = obj[0][0][0][1];
				updateSystemName();
				updateLocal("reset");

				if(obj[0][2] && obj[0][2][2] && obj[0][2][2]["(instanceName)"] && obj[0][2][2]["(instanceName)"] == "eve.common.script.sys.rowset.Rowset") {
					var headers = obj[0][2][2]["(instanceData)"]["header"];
					var lines = obj[0][2][2]["(instanceData)"]["lines"];
					for(var l in lines) {
						var res = {};
						for(var f in lines[l]) {
							res[headers[f]] = lines[l][f];
							if(headers[f] == "extra") res["charName"] = lines[l][f][1];
							if(headers[f] == "extra") res["charID"] = lines[l][f][0];
						}
						updateLocal("add", res);
					}
				}
			} else if(obj[1] && obj[1][1] && obj[1][1][0] && obj[1][1][0][0] && obj[1][1][0][0][0] == "solarsystemid2") { // join / leave system
				processJLObj(obj[1][1]);
			} else if(obj[1] && obj[1][1] && obj[1][1][0] && obj[1][1][0][1] && obj[1][1][0][1][0] && obj[1][1][0][1][0][0] == "solarsystemid2") { // join / leave system ONLSC
				processJLObj(obj[1][1][0][1]);
			} else if(obj[1] && obj[1][1] && obj[1][1][0] && obj[1][1][0][0] && obj[1][1][0][0][1] && obj[1][1][0][0][1][0] == "RemoveBalls") { // remove balls
				console.log("remove balls");
				var balls = obj[1][1][0][0][1][1][0];
				for(var b in balls)
					updateOverview("remove", balls[b]);
			} else if(obj[1] && obj[1][1] && typeof obj[1][1][0] == "object") {
				for(var i in obj[1][1][0]) {
					var el = obj[1][1][0][i];
					if(el && typeof el[0] == "number" && typeof el[1] == "object") {
						switch(el[1][0]) {
							case "OnSpecialFX":

								var effect = el[1][1][5];
								var fit = parseInt(el[1][1][0]);
								var item = el[1][1][1];
								var type = parseInt(el[1][1][2]);
								var charge = parseInt(el[1][1][4]);
								var isNPC = el[1][1][3] != null;

								if(!isNPC || true)
									switch(effect) {
										case "effects.EnergyVampire":
										case "effects.EnergyDestabilization":
										case "effects.ShieldTransfer":
										case "effects.CloakingCovertOps":
										case "effects.CloakingPrototype":
										case "effects.EnergyTransfer":
										case "effects.RemoteArmourRepair":
											addToFit(fit, item, type, false, "high");
											break;

										case "effects.ShieldBoosting":
										case "effects.ElectronicAttributeModifyActivate":
										case "effects.ElectronicAttributeModifyTarget":
										case "effects.TurretWeaponRangeTrackingSpeedMultiplyActivate":
										case "effects.TurretWeaponRangeTrackingSpeedMultiplyTarget":
										case "effects.ScanStrengthBonusActivate":
										case "effects.ScanStrengthBonusTarget":
											if(charge) addToFit(fit, item, type, true, charge);
										case "effects.StructureRepair":
										case "effects.ModifyShieldResonance":
										case "effects.WarpScramble":
										case "effects.ModifyTargetSpeed":
										case "effects.CargoScan":
										case "effects.MicroWarpDrive":
										case "effects.Afterburner":
										case "effects.TargetPaint":
										case "effects.SurveyScan":
										case "effects.ShipScan":
										case "effects.MicroJumpDriveEngage":
										case "effects.EMPWave":
											addToFit(fit, item, type, false, "med");
											break;

										case "effects.ArmorRepair":
											if(charge) addToFit(fit, item, type, true, charge);
										case "effects.ArmorHardening":
											addToFit(fit, item, type, false, "low");
											break;

										case "effects.ProjectileFired":
										case "effects.MissileDeployment":
										case "effects.TorpedoDeployment":
										case "effects.Laser":
										case "effects.Mining":
											addToFit(fit, item, type, false, "high");
											addToFit(fit, item, type, true, charge);
											break;
									}
								break;
						}
					}
				}
			}
		}
	}

	function processJLObj (obj) {
		if(curSolarSystemID != obj[0][0][1]) {
			curSolarSystemID = obj[0][0][1];
			updateSystemName();
			updateLocal("reset");
		}
		switch(obj[2]) {
			case "JoinChannel":
				var res = {};
				for(var f in obj[3]) {
					res[jlheaders[f]] = obj[3][f];
					if(jlheaders[f] == "extra") {
						res["charName"] = obj[3][f][1];
						res["charID"] = obj[3][f][0];
					}
				}
				updateLocal("add", res);
				break;
			case "LeaveChannel":
				updateLocal("remove", obj[3][2][0]);
				break;
		}
	}

	function processSnip () {

		var type = parseInt(getBytes(1), 16);
		var shared = (type & SHARED_FLAG) == SHARED_FLAG;
		type &= ~SHARED_FLAG;

		var result;

		switch(type) {
			case TYPE.TUPLE2:
				result = [processSnip(), processSnip()];
				break;

			case TYPE.FLOAT0:
			case TYPE.ZERO:
				result = 0;
				break;

			case TYPE.ONE:
				result = 1;
				break;

			case TYPE.MINUSONE:
				result = -1;
				break;

			case TYPE.LIST:
			case TYPE.TUPLE:
				result = Array.apply(null, Array(parseInt(getBytes(1), 16))).map(function () { return processSnip(); });
				break;

			case TYPE.INT32:
				result = parseInt(lTobEnd(getBytes(4)), 16);
				break;

			case TYPE.STRINGR:
				result = stringTable[parseInt(getBytes(1), 16)];
				break;

			case TYPE.LONG:
				result = new bigInt(lTobEnd(getBytes(parseInt(getBytes(1), 16))), 16).toString();
				break;

			case TYPE.INT16:
				result = parseInt(lTobEnd(getBytes(2)), 16);
				break;

			case TYPE.STRING:
			case TYPE.STRINGL:
			case TYPE.BUFFER:
				result = hexToString(getBytes(parseInt(getBytes(1), 16)));
				break;

			case TYPE.FLOAT:
				var ua = new Uint8Array(8);
				ua.set(getBytes(8).match(/.{1,2}/g).map(function (m) { return "0x" + m; }));
				result = new DataView(ua.buffer).getFloat64(0, true);
				break;

			case TYPE.TRUE:
				result = true;
				break;

			case TYPE.FALSE:
				result = false;
				break;

			case TYPE.NONE:
				result = null;
				break;

			case TYPE.STRING0:
			case TYPE.UNICODE0:
				result = "";
				break;

			case TYPE.DICT:
				var length = parseInt(getBytes(1), 16);
				var data = {};
				for(var i = 0; i < length; i++) {
					var tmp = processSnip();
					var tmpind = processSnip();
					if(typeof tmpind != "string" && typeof tmp == "string")
						data[tmp] = tmpind;
					else
						data[tmpind] = tmp;
				}
				result = data;
				break;

			case TYPE.UTF8:
				result = hexToString(getBytes(parseInt(getBytes(1), 16)));
				break;

			case TYPE.INT8:
				result = parseInt(lTobEnd(getBytes(1)), 16);
				break;

			case TYPE.REF:
				result = STORAGE[parseInt(getBytes(1), 16) - 1];
				break;

			case TYPE.LIST0:
			case TYPE.TUPLE0:
				result = [];
				break;

			case TYPE.INSTANCE:
				result = { "(instanceName)": processSnip(), "(instanceData)": processSnip() };
				break;

			case TYPE.DBROW:
				result = processDBROW();
				break;

			case TYPE.GLOBAL:
				result = { "(global)": hexToString(getBytes(parseInt(getBytes(1), 16))) };
				break;

			case TYPE.CALLBACK:
				result = { "(callback)": processSnip() };
				break;

			case TYPE.REDUCE:
				var results = [];
				var tmpres;
				while((tmpres = processSnip()) && tmpres != "(mark)") {
					results.push(tmpres);
				}
				processSnip(); // remove 2nd mark
				result = { "(reduce)": results };
				break;

			case TYPE.NEWOBJ:
				result = { "(newobj)": processSnip() };
				break;

			case TYPE.MARK:
				result = "(mark)";
				break;

			case TYPE.TUPLE1:
			case TYPE.LIST1:
				result = [processSnip()];
				break;

			case TYPE.INT64:
				result = new bigInt(lTobEnd(getBytes(8)), 16).toString();
				break;

			case TYPE.STRING1:
				result = hexToString(getBytes(1));
				break;

			case TYPE.STREAM:
				var tmpind = ind;
				var length = parseInt(getBytes(1), 16);
				ind += 2 + (2 * 4);
				var res = { "(marshal)": [] };
				while(ind < (tmpind + (length * 2))) res["(marshal)"].push(processSnip());
				result = res;
				break;

			case 0x00:
				break;

			default:
				if(settings.logging) console.log("TYPE " + type + " OFF " + ind);
		}

		if(shared) {
			STORAGE.push(result);
		}
		return result;
	}

	function processDBROW () {
		var columns = processSnip();
		if(!columns) return;
		if(columns["(reduce)"]) {
			columns = columns["(reduce)"][0][1][0];
		} else {
			return;
		}

		var result = {};

		for(var c in columns) {
			var tmpres;

			switch(columns[c][1]) {

				case DBTYPE.BOOL:
					tmpres = (dat[ind >> 3] & (1<<(ind & 0x7)));
					break;

				case DBTYPE.I1:
				case DBTYPE.UI1:
					tmpres = getBytes(1);
					break;

				case DBTYPE.I2:
				case DBTYPE.UI2:
					tmpres = getBytes(2);
					break;

				case DBTYPE.I4:
				case DBTYPE.UI4:
				case DBTYPE.R4:
					tmpres = getBytes(3);
					break;

				case DBTYPE.I8:
				case DBTYPE.R8:
					tmpres = getBytes(4);
					break;

				case DBTYPE.STR:
				case DBTYPE.WSTR:
				case DBTYPE.BYTES:
					tmpres = hexToString(getBytes(4));
					break;
			}

			result[columns[c][0]] = tmpres;
		}

		return { "(dbrow)": { columns: columns, result: result } };
	}
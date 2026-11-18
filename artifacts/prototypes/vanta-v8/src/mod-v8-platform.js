// Version 8, builder 1 (v8w-): search everywhere (⌘K), tickets on records (Jira, ServiceNow), AI agents with an approval queue,
// roles and permissions, and the risk library.
// Real: the ATT&CK techniques of NIST SP 800-160 Vol. 2 Rev. 1 Appendices F and G (REPO supabase/reference, embedded below as D8),
// WS-X90's risks, operational issues, POA&M items, requirements and evidence (copied from mod-after-risk.js, mod-v7-program.js and
// mod-after-docs.js), its controls, elements and people (PA.SSP), the workspace roles (tenant_memberships' check: owner, admin,
// editor, viewer) and every program role assignment with its period (program_role_assignments, read Nov 18), and the database's
// role rules (migration 20261117125128_program_roles_held_to_acts). Invented, and marked Example: tickets, agents and their runs,
// members' workspace roles but the owner's, last active, the proposed permissions, the weapon system scenarios and custom ones.
(function () {
  const PA = window.PA, { S, P, M, ROUTE_NAV, data, h } = PA, AK = PA.AK, SSP = PA.SSP;
  if (!AK || !SSP) return;
  const { esc, fmt, pill, gl, tag } = h;
  const D8 = {"tac":["Reconnaissance","Resource Development","Initial Access","Execution","Persistence","Privilege Escalation","Defense Evasion","Credential Access","Discovery","Lateral Movement","Collection","Command and Control","Exfiltration","Impact","Initial Access","Execution","Persistence","Privilege Escalation","Evasion","Discovery","Lateral Movement","Collection","Command and Control","Inhibit Response Function","Impair Process Control","Impact"],"mit":{"M1017":"User Training","M1048":"Application Isolation and Sandboxing","M1050":"Exploit Protection","M1026":"Privileged Account Management","M1030":"Network Segmentation","M1042":"Disable or Remove Feature or Program","M1035":"Limit Access to Resource over Network","M1034":"Limit Hardware Installation","M1016":"Vulnerability Scanning","M1045":"Code Signing","M1038":"Execution Prevention","M1018":"User Account Management","M1040":"Behavior Prevention on Endpoint","M1047":"Audit","M1029":"Remote Data Storage","M1021":"Restrict Web-Based Content","M1022":"Restrict File and Directory Permissions","M1046":"Boot Integrity","M1019":"Threat Intelligence Program","M1041":"Encrypt Sensitive Information","M1043":"Credential Access Protection","M1037":"Filter Network Traffic","M1054":"Software Configuration","M1049":"Antivirus/Antimalware","M1031":"Network Intrusion Prevention","M1028":"Operating System Configuration","M1025":"Privileged Process Integrity","M1020":"SSL/TLS Inspection","M1053":"Data Backup","CM1101":"Present Deceptive Information","CM1102":"Maintain Deception Environment","CM1103":"Detonation Chamber","CM1104":"Passive Decoys","CM1105":"Component Provenance Validation","CM1106":"Supply Chain Diversity","CM1107":"Adversarial Simulation","CM1108":"Dynamically Restrict Traffic or Isolate Resources","CM1109":"Virtual Sandbox","CM1110":"Application- or Utility-Specific Data Removal","CM1111":"Execution Restriction","CM1112":"Covert Signaling","CM1113":"Present Decoy Data","CM1114":"Fragment Information","CM1115":"Lock Down Thin Nodes","CM1116":"Dynamic Data Location","CM1117":"Dynamic Account Management","CM1118":"Partition Host","CM1119":"Minimize Local Functionality","CM1120":"Trusted Path","CM1121":"Dynamically Disable or Suspend","CM1122":"Perform Mission Damage Assessment","CM1123":"Active Decoys","CM1124":"Minimize Data Retention or Lifespan","CM1125":"Authenticate Devices","CM1126":"Enhanced Authentication","CM1127":"Minimize Duration of Connection or Session","CM1128":"Design Diversity","CM1129":"Check Policy Consistency","CM1130":"Validate Data Quality","CM1131":"Active Deception","CM1132":"Quarantine or Delete Suspicious Files","CM1133":"Isolate or Contain Selected Applications or Components","CM1134":"Refresh Selected Applications or Components","CM1135":"Hide Sensitive Information","CM1136":"Identify External Malware","CM1137":"Validate Data Properties","CM1138":"Switch to Alternative Data Sources","CM1139":"Dynamically Reprovision","CM1140":"Use Alternate Communications","CM1141":"Reconstruct Compromised Assets","CM1142":"Switch to Protected Hot Shadow","CM1143":"Switch to Alternate System or Component","CM1144":"Activate Alternate","CM1145":"Defend Failover and Recovery","CM1146":"Refresh Sessions or Connections","CM1147":"Defend Against DoS","CM1148":"Conceal or Randomize Network Traffic","CM1149":"Lock Down Visibility or Access","CM1150":"Dynamically Relocate and Refresh Processing","CM1151":"Defend Enclave Boundaries","CM1152":"Defend Against Memory Attacks","CM1153":"Modulate Information Flows","CM1154":"Hardware-Based Protection of Firmware","CM1155":"Validate Output Data","CM1156":"Physically Relocate Resources","CM1157":"Defend Against Data Mining","CM1158":"Defend Audit Data","CM1159":"Enhance User Preparedness","CM1160":"Conceal Resources from Discovery","CM1161":"Collaborate to Counter Adversaries","CM1162":"Restrict Supply Chain Exposures","CM1163":"Redefine System","CM1164":"Calibrate Administrative Access","CM2002":"Inspect and Analyze Network Traffic","CM2003":"Endpoint Behavior Analysis","CM2004":"Monitor Logs","CM2005":"Analyze Logs","CM2006":"Analyze File Contents","CM2007":"Host Event Detection","CM2008":"Removable Device Usage Detection","CM2009":"Software Integrity Check","CM2010":"Software Stress Testing","CM2011":"Physical Inspection","CM2012":"Monitor Trusted Parties","CM2013":"Cross-Enterprise Account Usage Analysis","CM2014":"Process Analysis","CM2015":"Process Monitoring","CM2016":"Cloud Account Monitoring","CM2017":"Privileged Account Monitoring","CM2018":"Cross-Enterprise Behavior Analysis","CM2019":"Endpoint Scrutiny","CM2020":"Application- or Utility-Specific Monitoring","CM2021":"Account Monitoring","CM2022":"Host-Local Event Correlation","CM2023":"Centralize and Analyze Instance Logging","CM2029":"Monitor Script Execution","CM2030":"Monitor and Analyze API Use","CM2033":"Monitor the File System","CM2034":"Monitor Specific Servers","CM2035":"Monitor Specific Files","CM2038":"Monitor Command Line Use","CM2040":"Monitor Use of Libraries and Utilities","CM2041":"Analyze Network Traffic Content","CM2042":"Analyze Outgoing Traffic Patterns","CM2043":"Monitor External Sources","CM2044":"Monitor Platform Status","CM2047":"Monitor Network Usage","CM2048":"Hunt for Malicious Processes","CM1301":"Dynamic Threat Awareness and Response","CM1302":"Mission-Oriented Cyber Situational Awareness","CM1303":"Integrated Non-Disruptive Response","CM1304":"Enhance via Unpredictability","CM1305":"Enhance via Heterogeneity","CM1306":"Lock Down Usage","CM1307":"Enhance via Layered Protections","CM1308":"Separate Environments with Specific Risks","CM1309":"Vulnerability-Oriented Cyber Situational Awareness","CM1310":"Protect Distributed Processing and Storage","CM1311":"Enhance via Isolation","CM1312":"Enhance Isolation via Hardware Features","CM1313":"Validate or Assess Control Effectiveness in Practice","CM1314":"Enhance via Automation","CM1315":"Maintain a War-Time Reserve","CM1316":"Enhance via Coordination","M0942":"Disable or Remove Feature or Program","M0930":"Network Segmentation","M0948":"Application Isolation and Sandboxing","M0950":"Exploit Protection","M0947":"Audit","M0941":"Encrypt Sensitive Information","M0926":"Privileged Account Management","M0919":"Threat Intelligence Program","M0800":"Authorization Enforcement","M0801":"Access Management","M0928":"Operating System Configuration","M0802":"Communication Authenticity","M0807":"Network Allowlists","M0937":"Filter Network Traffic","M0945":"Code Signing","M0916":"Vulnerability Scanning","M0808":"Encrypt Network Traffic","M0813":"Software Process and Device Authentication","M0806":"Minimize Wireless Signal Propagation","M0938":"Execution Prevention","M0944":"Restrict Library Loading","M0921":"Restrict Web-Based Content","M0946":"Boot Integrity","M0922":"Restrict File and Directory Permissions","M0915":"Active Directory Configuration","M0918":"User Account Management","M0932":"Multi-factor Authentication","M0931":"Network Intrusion Prevention","M0810":"Out-of-Band Communications Channel","M0920":"SSL/TLS Inspection","M0953":"Data Backup","M0815":"Watchdog Timers","M0924":"Restrict Registry Permissions","M0805":"Mechanical Protection Layers","M0812":"Safety Instrumented Systems","M0811":"Redundancy of Service","M0809":"Operational Information Confidentiality","M0803":"Data Loss Prevention","CM1201":"Present Deceptive Information","CM1202":"Maintain Deception Environment","CM1204":"Passive Decoys","CM1205":"Component Provenance Validation","CM1207":"Adversarial Simulation","CM1208":"Dynamically Restrict Traffic or Isolate Resources","CM1209":"Virtual Sandbox","CM1222":"Perform Mission Damage Assessment","CM1223":"Active Decoys","CM1226":"Enhanced Authentication","CM1227":"Minimize Duration of Connection or Session","CM1230":"Validate Data Quality","CM1234":"Refresh Selected Applications or Components","CM1237":"Validate Data Properties","CM1242":"Switch to Protected Hot Standby","CM1245":"Defend Failover and Recovery","CM1247":"Defend Against DoS","CM1248":"Conceal or Randomize Network Traffic","CM1253":"Modulate Information Flows","CM1254":"Hardware-Based Protection of Firmware","CM1255":"Validate Output Data","CM1259":"Enhance User Preparedness","CM1260":"Conceal Resources from Discovery","CM1262":"Restrict Supply Chain Exposures","CM1275":"Emergency Shutdown","CM1276":"Safe Mode Restart","CM1277":"Coordinate Responses to Adversity","CM2102":"Inspect and Analyze Network Traffic","CM2103":"Endpoint Behavior Analysis","CM2104":"Monitor Logs","CM2105":"Analyze Logs","CM2106":"Analyze File Contents","CM2108":"Removable Device Usage Detection","CM2109":"Software Integrity Check","CM2110":"Software Stress Testing","CM2111":"Physical Inspection","CM2113":"Cross Enterprise Account Usage Analysis","CM2115":"Process Monitoring","CM2117":"Privileged Account Monitoring","CM2118":"Cross-Enterprise Behavior Analysis","CM2120":"Application- or Utility-Specific Monitoring","CM2121":"Account Monitoring","CM2122":"Host-Local Event Correlation","CM2124":"Monitor Health and Status of Protective Systems","CM2129":"Monitor Script Execution","CM2133":"Monitor the File System","CM2138":"Monitor Command Line Use","CM2141":"Analyze Network Traffic Content","CM2144":"Monitor Platform Status","CM2147":"Monitor Network Usage"},"ctls":["SC-30(4)","SI-20","SC-26","SC-29","SC-7(16)","SC-28(1)","SC-30","SC-30(5)","IR-4(13)","SI-4(2)","SI-4(4)","AT-2(1)","AT-2(5)","AT-3(3)","SC-7(21)","SC-35","AT-2(3)","CA-8","CA-8(2)","PM-16","SR-3(2)","SR-7","SR-6(1)","AU-13","AU-13(3)","RA-5(4)","RA-10","SR-5","SR-11","SR-10","CM-7(7)","AC-4(21)","AC-6(4)","SC-18(5)","SC-39","CM-7(6)","AC-4(8)","AC-2(12)","AC-6(2)","AU-6","AC-4(2)","SC-7","SC-7(22)","CM-7(2)","IA-2(13)","SC-10","SI-14(3)","SC-23(3)","SI-4(13)","SI-4(16)","AC-6(3)","AC-6(10)","CM-8(3)","IA-3(1)","SC-44","SC-7(20)","SI-14","SA-9(7)","SR-4(3)","SR-4(4)","SI-7","SI-7(1)","CM-14","SR-9","SR-4","SR-4(1)","SR-4(2)","PL-8(2)","SR-3(1)","SI-10(3)","PM-30(1)","AC-6(7)","AU-6(3)","SI-7(15)","SC-3(3)","CM-7(4)","CM-7(5)","SC-25","SI-14(2)","AC-4(3)","IR-4(2)","IR-4(3)","SI-3(10)","SI-14(1)","AC-3(13)","AC-6","AC-6(5)","SC-7(29)","IR-4(12)","SI-4(11)","AU-6(5)","RA-5(10)","SI-4(17)","AC-6(8)","SC-34(1)","SC-34","AU-10(2)","SI-7(6)","CA-7(5)","PL-8(1)","SI-4(24)","SI-6","SI-7(9)","SC-51","SC-2","SC-2(1)","SC-32","SC-32(1)","IA-10","CP-13","SC-47","SC-16(1)","SC-16(3)","SI-16","RA-3(3)","AC-3(11)","SC-30(3)","AC-3(12)","SI-7(7)","AC-6(1)","AU-9(3)","SC-8(4)","AU-9(2)","AU-9(6)","AU-9(1)","IR-4(4)","IA-5(7)","AU-9(7)","SC-29(1)","AC-4(17)","SI-21","SA-17(9)","SC-11","SC-7(11)","SI-10(5)","AU-6(8)","SC-8(1)","SC-8(5)","IA-5","IR-5","IA-2(6)","AC-12","SC-3","AC-4(27)","AC-4(30)","AC-4(29)","SC-30(2)","SC-7(15)","SC-15(1)","AC-2(8)","SI-23","AC-23","SI-19(8)","SI-19(4)","AC-2(6)","AC-4(12)","SC-46","SI-4(10)","SI-4(25)","SC-7(3)","SC-7(5)","SC-7(10)","SI-4(18)","AC-7(4)","CP-9","CP-9(6)","CP-2(8)","RA-9","SI-4(1)","SI-22","SC-36","IR-4(9)","CP-2(5)","CP-9(8)","SI-15","SC-48","SC-48(1)","AU-5(3)","SC-5(2)","SC-5(3)","SI-7(10)","CM-5(5)","SA-20","SA-23","SC-22","IR-4(14)","SI-3","CA-8(1)","AC-3(7)","SI-7(12)","SA-11(4)","SR-11(3)","SC-40(2)","AC-3","CM-7","SC-8","SC-28","PM-16(1)","SC-37","SC-36(1)","SI-4(7)","SA-8(3)","SA-8(2)","CP-12","CP-2(1)","CP-4(5)","CP-11","PM-31","PE-14(2)"],"techs":[["T1595","Active Scanning","F",[0],["CM1101","CM1104","CM1160","CM2002"],[0,1,2,3,4,5,6,7,8,9,10],"F-3"],["T1592","Gather Victim Host Information","F",[0],["CM1101","CM1104","CM1113","CM1160"],[0,2,3,1,5,6,7],"F-3"],["T1589","Gather Victim Identity Information","F",[0],["CM1101","CM1113","CM1159","CM2002"],[0,1,11,12,13,8,9,10],"F-3"],["T1590","Gather Victim Network Information","F",[0],["CM1102","CM1113","CM2002"],[2,14,0,1,8,9,10],"F-3"],["T1591","Gather Victim Org Information","F",[0],["CM1101","CM1113"],[0,1],"F-3"],["T1598","Phishing for Information","F",[0],["M1017","CM1107","CM1101","CM1123","CM1159","CM2041"],[12,11,13,0,15,16,8],"F-3"],["T1597","Search Closed Sources","F",[0],["CM1107","CM1161","CM1162"],[17,18,0,1,19,20,21,22],"F-3"],["T1596","Search Open Technical Databases","F",[0],["CM1101","CM1107","CM1162"],[0,1,17,18,20,21,22],"F-3"],["T1593","Search Open Websites or Domains","F",[0],["CM1101"],[0,1],"F-3"],["T1594","Search Victim-Owned Websites","F",[0],["CM1101","CM1113"],[0,1],"F-3"],["T1583","Acquire Infrastructure","F",[1],["CM1101","CM1107","CM1161"],[0,17,18,19],"F-4"],["T1586","Compromise Accounts","F",[1],["CM1159","CM2043"],[11,16,12,13,23,24,25,26],"F-4"],["T1584","Compromise Infrastructure","F",[1],["CM2043"],[23,24,19,25,26],"F-4"],["T1587","Develop Capabilities","F",[1],["CM2043"],[19,26],"F-4"],["T1585","Establish Accounts","F",[1],["CM1159","CM2043"],[11,12,13,23,24,25,26],"F-4"],["T1588","Obtain Capabilities","F",[1],["CM1159","CM2043"],[11,12,13,19,26],"F-4"],["T1608","Stage Capabilities","F",[1],["CM1162","CM2043"],[27,28,22,29,30,19,26],"F-4"],["T1189","Drive-By Compromise","F",[2],["M1048","M1050","CM1123","CM2002","CM2003"],[31,32,33,34,35,36,8,2,15,9,10,37],"F-5"],["T1190","Exploit Public-Facing Application","F",[2],["M1048","M1026","CM2004","CM1101","CM1102","CM1107"],[31,32,33,34,35,38,39,0,2,14,17,18],"F-5"],["T1133","External Remote Services","F",[2,4],["M1030","M1042","CM1126","CM1127","CM1124","CM2005"],[40,31,41,14,42,43,44,45,46,47,48,49],"F-5, F-7"],["T1200","Hardware Additions","F",[2],["M1035","M1034","CM1125","CM2007","CM1101"],[50,51,52,53,0],"F-5"],["T1566","Phishing","F",[2],["M1017","CM1101","CM1103","CM1123"],[11,16,12,0,54,2,15],"F-5"],["T1091","Replication Through Removable Media","F",[2,9],["M1042","CM1109","CM2008"],[43,55,52,56],"F-5, F-12"],["T1195","Supply Chain Compromise","F",[2],["M1016","CM2009","CM2010","CM2011","CM1105","CM1106"],[57,58,59,60,61,62,22,63,29,64,65,66,67,68,20],"F-5"],["T1199","Trusted Relationship","F",[2],["M1030","CM2012"],[41,14,19,69,70],"F-5"],["T1078","Valid Accounts","F",[2,4,5,6],["M1026","CM1101","CM2013"],[71,0,1,72,49],"F-5, F-7, F-8, F-9"],["T1059","Command and Scripting Interpreter","F",[3],["M1045","M1042","M1038","CM2029","CM2038","CM1119","CM1132","CM1131"],[73,43,74,75,76,8,9,48,77,58,35,56,78,79,80,81,14,0,2,82],"F-6"],["T1609","Container Administration Command","F",[3],["M1038","CM1111","CM2005"],[83,84,37,49],"F-6"],["T1610","Deploy Container","F",[3,6],["M1018","CM1164","CM2005","CM2007","M1030"],[71,85,86,43,49,8,9,41,42,87],"F-6, F-9"],["T1203","Exploitation for Client Execution","F",[3],["M1048","CM1103","CM2003","CM2019","CM1131"],[31,32,34,35,54,37,88,80,79,81,14,0,2],"F-6"],["T1559","Inter-Process Communication","F",[3],["M1040","M1042","CM2040","CM2047","CM1131"],[43,8,9,10,48,89,80,79,81,14,0,2],"F-6"],["T1106","Native API","F",[3],["M1038","CM2022","CM1131"],[76,8,49,80,79,81,14,0,2],"F-6"],["T1053","Scheduled Task/Job","F",[3,4,5],["M1047","CM1104","CM2004","CM2035"],[90,91,2,39],"F-6, F-7, F-8"],["T1129","Shared Modules","F",[3],["M1038","CM1111","CM2022","CM1131"],[76,84,8,49,80,79,81,14,0,2],"F-6"],["T1072","Software Deployment Tools","F",[3,9],["M1026","M1029","M1018","CM1133","CM1134","CM2012","CM2018","CM1131"],[86,32,71,35,83,19,70,92,90,72,80,79,81,14,0,2],"F-6, F-12"],["T1569","System Services","F",[3],["M1026","M1018","CM2004","CM2038","CM2035","CM1131"],[93,84,39,8,9,80,79,81,14,0,2],"F-6"],["T1204","User Execution","F",[3],["M1021","CM1119","CM1136","CM2020"],[36,43,77,15,8,9],"F-6"],["T1047","Windows Management Instrumentation","F",[3],["M1026","CM1164","CM2002","CM2015","CM1131"],[86,71,85,43,8,9,10,80,79,81,14,0,2],"F-6"],["T1098","Account Manipulation","F",[4],["M1030","M1026","CM1101","CM2018","CM1126","CM2021"],[31,41,55,14,38,0,1,90,44,37],"F-7"],["T1197","BITS Jobs","F",[4,6],["CM1102","CM2020"],[2,14,0,8,9],"F-7, F-9"],["T1547","Boot or Logon Autostart Execution","F",[4,5],["CM1102","CM1104","CM1115","CM1134","CM2044"],[2,14,0,77,94,95,78,8,9],"F-7, F-8"],["T1037","Boot or Logon Initialization Scripts","F",[4,5],["CM1104","CM1115","CM1134","CM2015","CM2029","CM2044"],[2,77,94,95,83,8,9,48],"F-7, F-8"],["T1176","Browser Extensions","F",[4],["M1047","CM1123","CM2020","CM2015"],[96,2,15,8,9],"F-7"],["T1554","Compromise Client Software Binary","F",[4],["M1045","CM1115","CM2019","CM2009"],[73,77,94,95,88,61,97],"F-7"],["T1136","Create Account","F",[4],["CM1129","CM2015"],[98,8,9],"F-7"],["T1543","Create or Modify System Process","F",[4,5],["M1047","CM1104","CM1134","CM2009"],[98,2,83,60,61],"F-7, F-8"],["T1546","Event Triggered Execution","F",[4,5],["CM2035","CM2015","CM1104","CM1134","CM2009"],[39,8,9,2,83,60,61],"F-7, F-8"],["T1574","Hijack Execution Flow","F",[4,5,6],["M1047","M1038","M1022","CM1123","CM1137","CM2015","CM2033"],[78,76,95,2,15,60,61,99,8,9,100],"F-7, F-8, F-9"],["T1525","Implant Internal Image","F",[4],["M1047","M1045","CM2021","CM1134","CM2033"],[60,61,73,8,9,83],"F-7"],["T1137","Office Application Startup","F",[4],["CM1134","CM2004","CM2020","CM2033"],[83,39,9,8],"F-7"],["T1542","Pre-OS Boot","F",[4,6],["M1046","CM1134","CM2019","CM1154","CM2022"],[101,60,61,102,83,88,103,8,49],"F-7, F-9"],["T1505","Server Software Component","F",[4],["M1047","M1045","CM2005","CM2015"],[60,61,73,37,49,8,9],"F-7"],["T1205","Traffic Signaling","F",[4,6,11],["CM1127","CM2002","CM1104"],[45,46,8,9,10,2],"F-7, F-9, F-14"],["T1548","Abuse Elevation Control Mechanism","F",[5,6],["M1038","M1047","CM1118","CM2005","CM2033"],[76,90,91,104,105,106,107,37,8,9],"F-8, F-9"],["T1134","Access Token Manipulation","F",[5,6],["CM1113","CM1118","CM1126","CM1137","CM2038","CM2014"],[2,0,1,104,105,106,107,108,109,110,111,112,8,9],"F-8, F-9"],["T1611","Escape to Host","F",[5],["M1048","M1038","M1026","CM2005","CM2007"],[43,95,94,85,49,8,9],"F-8"],["T1068","Exploitation for Privilege Escalation","F",[5],["M1048","M1050","M1019","CM1101","CM1134","CM2003"],[31,32,33,34,35,36,8,113,19,114,0,1,83,37],"F-8"],["T1484","Domain Policy Modification","F",[5,6],["M1018","M1047","CM1104","CM1149","CM2005"],[84,90,91,2,115,37],"F-8, F-9"],["T1055","Process Injection","F",[5,6],["M1026","CM1150","CM2007","CM2014","CM1152"],[71,93,116,83,8,9,113],"F-8, F-9"],["T1612","Build Image on Host","F",[6],["M1047","M1030","CM1111","CM1149","CM2002","CM2015"],[60,61,41,42,87,117,115,8,9,10],"F-9"],["T1140","Deobfuscate/Decode Files or Information","F",[6],["CM1110","CM2022"],[8,9,61,118,80,49],"F-9"],["T1006","Direct Volume Access","F",[6],["CM1113","CM2015","CM2029"],[0,1,8,9,48],"F-9"],["T1480","Execution Guardrails","F",[6],["CM1131"],[80,79,81,14,0,2],"F-9"],["T1211","Exploitation for Defense Evasion","F",[6],["M1048","M1050","M1019","CM1131"],[31,32,34,35,36,113,19,114,80,79,81,14,0,2],"F-9"],["T1222","File and Directory Permissions Modification","F",[6],["M1026","CM1101","CM2005"],[71,93,0,1,37,49],"F-9"],["T1564","Hide Artifacts","F",[6],["CM1115","CM2004","CM2033"],[77,94,95,8,9,100],"F-9"],["T1562","Impair Defenses","F",[6],["M1022","M1018","CM1102","CM1115","CM2015"],[119,2,14,0,77,94,95,8,9],"F-9"],["T1070","Indicator Removal on Host","F",[6],["M1041","M1029","M1022","CM1104","CM1158","CM2033"],[120,121,5,122,78,123,2,124,8,9],"F-9"],["T1202","Indirect Command Execution","F",[6],["CM1102","CM2005"],[2,14,0,37,49],"F-9"],["T1036","Masquerading","F",[6],["M1038","M1045","CM1102","CM2033"],[75,73,2,14,0,8,9,100],"F-9"],["T1556","Modify Authentication Process","F",[6,7],["M1026","CM1126","CM2018","CM2021"],[71,108,109,110,90,37],"F-9, F-10"],["T1578","Modify Cloud Compute Infrastructure","F",[6],["CM2023"],[90,125],"F-9"],["T1112","Modify Registry","F",[6],["CM1102","CM2044","CM2015"],[2,14,0,8,9],"F-9"],["T1601","Modify System Image","F",[6],["M1046","M1045","M1026","CM1137","CM1134","CM2009","M1043"],[60,61,97,102,73,58,126,5,86,111,112,83],"F-9"],["T1599","Network Boundary Bridging","F",[6],["M1037","M1026","CM1134","CM2002","CM1305","CM2044"],[79,80,10,86,83,8,9,127,3,128],"F-9"],["T1027","Obfuscated Files or Information","F",[6],["CM1103","CM1110","CM2038"],[54,8,9,61,118,80],"F-9"],["T1207","Rogue Domain Controller","F",[6],["CM1130","CM2002"],[61,8,9],"F-9"],["T1014","Rootkit","F",[6],["CM1102","CM1164","CM2044"],[2,14,0,85,86,43,8,9],"F-9"],["T1218","Signed Binary Proxy Execution","F",[6],["M1026","M1042","CM1119","CM1132","CM1131","CM2015","CM2020"],[71,93,43,74,77,58,35,56,78,80,79,81,14,0,2,9,8],"F-9"],["T1216","Signed Script Proxy Execution","F",[6],["CM1119","CM1132","CM2015","CM2029","CM2038","CM1131"],[77,58,35,56,78,9,8,48,80,79,81,14,0,2],"F-9"],["T1553","Subvert Trust Controls","F",[6],["M1038","M1054","CM1119","CM1124","CM1131","CM2005","CM2009"],[76,129,77,47,78,130,80,79,81,14,0,2,48,97],"F-9"],["T1221","Template Injection","F",[6],["M1049","M1042","M1031","CM1104","CM2020"],[54,43,2,8,9],"F-9"],["T1127","Trusted Developer Utilities Proxy Execution","F",[6],["M1042","M1038","CM2015"],[43,74,76,8,9],"F-9"],["T1535","Unused/Unsupported Cloud Regions","F",[6],["M1054","CM2004"],[84,39,89],"F-9"],["T1550","Use Alternate Authentication Material","F",[6,9],["CM1124","CM1126","CM2013"],[47,78,130,108,72,49],"F-9, F-12"],["T1497","Virtualization/Sandbox Evasion","F",[6,8],["CM1102","CM1123"],[2,14,0,15],"F-9, F-11"],["T1600","Weaken Encryption","F",[6],["CM1111","CM1134"],[84,83],"F-9"],["T1220","XSL Script Processing","F",[6],["CM1119","CM1132","CM2015"],[77,58,35,78,8,9],"F-9"],["T1110","Brute Force","F",[7],["CM1126","CM1128","CM1101","CM2004","CM1129"],[44,131,0,1,39,98],"F-10"],["T1555","Credentials from Password Stores","F",[7],["CM1101","CM2033"],[0,1,8,9],"F-10"],["T1212","Exploitation for Credential Access","F",[7],["M1048","M1050","M1019","CM2003"],[31,32,34,35,36,19,114,37],"F-10"],["T1187","Forced Authentication","F",[7],["CM2002","CM2003"],[37],"F-10"],["T1056","Input Capture","F",[7,10],["CM1120","CM1101","CM2005","CM2033"],[132,0,1,37,49,8,9],"F-10, F-13"],["T1557","Man-in-the-Middle","F",[7,10],["M1042","M1037","M1035","M1031","M1030","CM2002","CM1131"],[43,74,133,134,50,10,41,14,42,8,80,79,81,2],"F-10, F-13"],["T1040","Network Sniffing","F",[7,8],["CM1101","CM1126","CM2017","M1041","CM1148","CM1127","CM2002"],[0,1,44,135,136,137,6,46,8,9,10],"F-10, F-11"],["T1003","OS Credential Dumping","F",[7],["M1028","M1025","CM1135","CM2004","CM2038","CM1107","M1043"],[138,128,43,5,39,8,17,18],"F-10"],["T1528","Steal Application Access Token","F",[7],["M1021","CM1159","CM2048"],[32,11,16,12,13,139],"F-10"],["T1558","Steal or Forge Kerberos Tickets","F",[7],["M1041","CM1113"],[6,0],"F-10"],["T1539","Steal Web Session Cookie","F",[7],["M1054","CM1124"],[78,130],"F-10"],["T1111","Two-Factor Authentication Interception","F",[7],["CM2004"],[39],"F-10"],["T1552","Unsecured Credentials","F",[7],["M1041","M1037","CM1101","CM1118","CM2018"],[5,140,74,0,1,104,105,106,107,72,90],"F-10"],["T1087","Account Discovery","F",[8],["CM1101","CM2015","CM2020"],[0,1,8,9],"F-11"],["T1010","Application Window Discovery","F",[8],["CM2015","CM2020"],[8,9],"F-11"],["T1217","Browser Bookmark Discovery","F",[8],["CM2015","CM2020"],[8,9],"F-11"],["T1580","Cloud Infrastructure Discovery","F",[8],["M1018","CM2004"],[85,71,39],"F-11"],["T1538","Cloud Service Dashboard","F",[8],["M1018","CM2004"],[85,71,39],"F-11"],["T1526","Cloud Service Discovery","F",[8],["CM1101","CM1104","CM2020"],[0,2,3,8,9],"F-11"],["T1613","Container and Resource Discovery","F",[8],["M1030","M1018","CM1158","CM2023"],[41,14,85,71,122,90,125],"F-11"],["T1482","Domain Trust Discovery","F",[8],["M1047","M1030","CM1101","CM2015","CM2020"],[98,40,31,41,0,1,8,9],"F-11"],["T1083","File and Directory Discovery","F",[8],["CM1104","CM1115","CM1116","CM2015","CM2020"],[2,77,116,8,9],"F-11"],["T1046","Network Service Scanning","F",[8],["M1030","CM1104","CM2002"],[40,31,41,2,8,9,10],"F-11"],["T1135","Network Share Discovery","F",[8],["CM1104","CM1160","CM2015","CM2020"],[2,4,6,7,8,9],"F-11"],["T1201","Password Policy Discovery","F",[8],["CM2015"],[8,9],"F-11"],["T1120","Peripheral Device Discovery","F",[8],["CM1115","CM1160","CM2015"],[77,4,6,7,8,9],"F-11"],["T1069","Permission Groups Discovery","F",[8],["CM1101","CM2015"],[0,1,8,9],"F-11"],["T1057","Process Discovery","F",[8],["CM1115","CM2015"],[77,8,9],"F-11"],["T1012","Query Registry","F",[8],["CM1101","CM1115","CM2015"],[0,1,77,8,9],"F-11"],["T1018","Remote System Discovery","F",[8],["CM1104","CM1160","CM2015"],[2,4,6,7,8,9],"F-11"],["T1518","Software Discovery","F",[8],["CM1115","CM2015"],[77,8,9],"F-11"],["T1082","System Information Discovery","F",[8],["CM1101","CM2015"],[0,8,9],"F-11"],["T1614","System Location Discovery","F",[8],["CM1101","CM1156","CM2015","CM2038"],[0,1,116,8],"F-11"],["T1016","System Network Configuration Discovery","F",[8],["CM1101","CM2015"],[0,8,9],"F-11"],["T1049","System Network Connections Discovery","F",[8],["CM1160","CM2015"],[4,6,7,8,9],"F-11"],["T1033","System Owner/User Discovery","F",[8],["CM1101","CM1115","CM1127","CM2015"],[0,1,77,141,8,9],"F-11"],["T1007","System Service Discovery","F",[8],["CM1115","CM2015"],[77,8,9],"F-11"],["T1124","System Time Discovery","F",[8],["CM2038"],[8,9,10],"F-11"],["T1210","Exploitation of Remote Services","F",[9],["M1048","M1042","M1050","M1030","M1019","CM1102","CM2003","CM2047"],[31,32,35,34,43,36,8,113,40,142,41,87,19,114,2,14,0,37,89,48],"F-12"],["T1534","Internal Spear-Phishing","F",[9],["CM1101","CM1159","CM2020"],[0,1,11,16,12,13,8,9],"F-12"],["T1570","Lateral Tool Transfer","F",[9],["CM1102","CM1108","CM1153","CM1115","CM2033"],[2,14,0,80,55,143,144,145,77,95,8,9,100],"F-12"],["T1563","Remote Service Session Hijacking","F",[9],["M1030","CM1127","CM1146","CM2021"],[40,31,41,141,46,47,146,37],"F-12"],["T1021","Remote Services","F",[9],["M1018","CM1102","CM1108","CM1153","CM2018"],[71,2,14,0,80,55,147,72,90],"F-12"],["T1080","Taint Shared Content","F",[9],["CM1131","CM1137","CM2015","CM2035"],[79,80,81,14,0,2,82,60,8,9,39],"F-12"],["T1560","Archive Collected Data","F",[10],["M1047","CM2033"],[90,8,9],"F-13"],["T1123","Audio Capture","F",[10],["CM2015","CM1121"],[8,9,148,149],"F-13"],["T1119","Automated Collection","F",[10],["M1041","M1029","CM1101","CM1116","CM1114","CM1157","CM2015"],[5,122,14,0,1,116,150,151,8,9],"F-13"],["T1115","Clipboard Data","F",[10],["CM2018"],[90],"F-13"],["T1530","Data from Cloud Storage Object","F",[10],["M1041","CM1126","CM2016"],[5,44,108,37],"F-13"],["T1602","Data from Configuration Repository","F",[10],["M1041","M1030","CM1101","CM2002"],[5,41,14,0,8,9,10],"F-13"],["T1213","Data from Information Repositories","F",[10],["M1047","CM1114","CM1101","CM1107","CM1124","CM1135","CM2017","CM2021","CM1117"],[90,91,150,0,1,152,78,130,153,135,37,154,149],"F-13"],["T1005","Data from Local System","F",[10],["CM1118","CM2015","CM1135"],[104,105,106,107,8,9,5],"F-13"],["T1039","Data from Network Shared Drive","F",[10],["CM1118","CM1101","CM1127","CM1135","CM2015","CM2033"],[106,0,1,46,5,8,9],"F-13"],["T1025","Data from Removable Media","F",[10],["CM1119","CM1121","CM2038","CM2020"],[77,149,8,9],"F-13"],["T1074","Data Staged","F",[10],["CM1116","CM2015","CM2033","CM2038","CM2020","CM1112"],[116,8,9,1],"F-13"],["T1114","Email Collection","F",[10],["M1047","M1041","CM1101","CM1126","CM2034","CM2015","CM2038","CM2020","CM2002"],[90,91,121,0,1,44,8,9,10],"F-13"],["T1185","Man-in-the-Browser","F",[10],["M1018","CM2020","CM1121"],[84,8,9,148,149],"F-13"],["T1113","Screen Capture","F",[10],["CM2020","CM2005"],[8,9,37,49],"F-13"],["T1125","Video Capture","F",[10],["CM1121","CM1120","CM2020","CM2005"],[149,132,8,9,37,49],"F-13"],["T1071","Application Layer Protocol","F",[11],["CM1133","CM1151","CM1153","CM2002","CM2041"],[35,14,31,42,36,155,129,143,144,145,156,8,10],"F-14"],["T1092","Communication Through Removable Media","F",[11],["M1028","M1042","CM1109","CM2008"],[43,56,55,52],"F-14"],["T1132","Data Encoding","F",[11],["CM2002","CM2041"],[8,10,157],"F-14"],["T1001","Data Obfuscation","F",[11],["CM1153","CM2002","CM2041"],[143,144,145,156,8,10,157],"F-14"],["T1568","Dynamic Resolution","F",[11],["M1021","CM1102","CM2002"],[0,2,14,8,10],"F-14"],["T1573","Encrypted Channel","F",[11],["M1020","CM1151","CM2002","CM2041"],[8,157,158,31,14,42,36,129,10],"F-14"],["T1008","Fallback Channels","F",[11],["CM1102","CM1146","CM1151","CM2002","CM2041"],[2,14,0,46,146,31,42,36,129,8,10],"F-14"],["T1105","Ingress Tool Transfer","F",[11],["CM1151","CM2015","CM2002","CM2033","CM2041"],[31,14,42,36,155,129,8,9,10],"F-14"],["T1104","Multi-Stage Channels","F",[11],["CM1146","CM1151","CM1153","CM2018"],[46,146,31,14,42,36,155,129,143,144,145,156,72,90],"F-14"],["T1095","Non-Application Layer Protocol","F",[11],["M1030","CM1151","CM1153","CM2002","CM2041"],[159,160,10,31,14,42,36,129,143,144,145,156,8],"F-14"],["T1571","Non-Standard Port","F",[11],["M1030","CM2002","CM2041"],[31,41,8,10],"F-14"],["T1572","Protocol Tunneling","F",[11],["CM1151","CM2002","CM2041","CM2047"],[31,14,42,36,129,8,10,89,48],"F-14"],["T1090","Proxy","F",[11],["M1020","CM1151","CM1153","CM2002","CM2041"],[8,157,158,31,14,42,36,129,143,144,145,156,10],"F-14"],["T1219","Remote Access Software","F",[11],["CM1104","CM1115","CM2002","CM2041"],[2,77,94,95,8,10],"F-14"],["T1102","Web Service","F",[11],["CM1104","CM2018","CM2042"],[2,72,90,8],"F-14"],["T1020","Automated Exfiltration","F",[12],["CM1107","CM1112","CM1113","CM1114","CM1153","CM2015","CM2002"],[17,161,1,0,2,150,143,144,145,8,9,39,10,162],"F-15"],["T1030","Data Transfer Size Limits","F",[12],["CM1112","CM1113","CM1114","CM2042","CM2047","CM2041"],[1,0,2,150,162,8],"F-15"],["T1048","Exfiltration Over Alternative Protocol","F",[12],["M1030","M1031","CM1112","CM1113","CM1114","CM2041","CM2042"],[10,41,159,160,1,0,2,150,8,162],"F-15"],["T1041","Exfiltration Over C2 Channel","F",[12],["M1031","CM1112","CM1113","CM1114","CM1127","CM2042","CM2047","CM2041"],[10,1,0,2,150,161,45,46,8],"F-15"],["T1011","Exfiltration Over Other Network Medium","F",[12],["CM1112","CM1113","CM1114","CM1127","CM2015","CM2035"],[1,0,2,150,161,45,46,8,9,39],"F-15"],["T1052","Exfiltration Over Physical Medium","F",[12],["M1042","CM1112","CM1113","CM1114","CM2007","CM2008"],[43,1,0,2,150,8,9,52],"F-15"],["T1567","Exfiltration Over Web Service","F",[12],["CM1112","CM1113","CM1114","CM1153","CM2042"],[1,0,2,150,143,144,145,8,162],"F-15"],["T1029","Scheduled Transfer","F",[12],["M1031","CM1112","CM1113","CM1114","CM1153","CM2015","CM2042"],[10,1,0,2,150,143,144,145,39,8,162],"F-15"],["T1537","Transfer Data to Cloud Account","F",[12],["CM1112","CM1113","CM1114","CM2016"],[1,0,2,150,37],"F-15"],["T1531","Account Access Removal","F",[13],["CM1140","CM1117","CM2015"],[163,110,154,149,8,9],"F-16"],["T1485","Data Destruction","F",[13],["M1053","CM1116","CM1130","CM2015","CM1122","CM1138","CM1139","CM1141","CM1142"],[164,165,116,57,61,8,9,166,167,168,60,169,80,79,150,170,171,40,36,172],"F-16"],["T1486","Data Encrypted for Impact","F",[13],["M1053","CM1104","CM1114","CM1116","CM2015","CM1122","CM1138","CM1139","CM1141","CM1142"],[164,173,165,2,150,116,8,9,166,167,168,60,61,169,80,79,170,171,40,36,172],"F-16"],["T1565","Data Manipulation","F",[13],["M1030","M1041","CM1104","CM1120","CM1137","CM1138","CM1155","CM2006"],[40,31,87,5,2,132,60,61,99,169,80,174,29],"F-16"],["T1491","Defacement","F",[13],["M1053","CM1104","CM1116","CM1130","CM2015"],[164,165,173,2,116,57,61,8,9],"F-16"],["T1561","Disk Wipe","F",[13],["M1053","CM1104","CM1116","CM2007","CM1122","CM1138","CM1139","CM1141","CM1142","CM1143","CM1145"],[164,165,2,116,8,9,166,167,168,60,61,169,80,79,150,170,171,40,36,172,3,131,81,175,176,55,154],"F-16"],["T1499","Endpoint Denial of Service","F",[13],["M1037","CM1102","CM1108","CM1118","CM1147","CM2047","CM1122"],[79,133,2,14,0,177,80,55,104,106,178,179,8,166,167,168,60,61],"F-16"],["T1495","Firmware Corruption","F",[13],["M1046","M1026","CM1143","CM1144","CM1145","CM1154"],[60,102,180,86,181,3,131,80,172,182,183,81,175,176,55,168,154,103],"F-16"],["T1490","Inhibit System Recovery","F",[13],["M1053","CM2015","CM2033","CM1122","CM1143","CM1144","CM1145"],[164,165,173,8,9,100,166,167,168,60,61,3,131,80,172,182,183,81,175,176,55,154],"F-16"],["T1498","Network Denial of Service","F",[13],["M1037","CM1108","CM2047","CM1143","CM1147"],[79,133,177,80,55,8,184,178,179],"F-16"],["T1496","Resource Hijacking","F",[13],["CM2044","CM2047","CM1139","CM1121"],[8,9,89,48,80,55,148,149],"F-16"],["T1489","Service Stop","F",[13],["M1030","CM2015","CM2044","CM1122"],[185,142,87,8,9,166,167,168,60,61],"F-16"],["T1529","System Shutdown/Reboot","F",[13],["CM1104","CM2015","CM1122","CM1143"],[2,8,9,166,167,168,60,61,3,131,80,172],"F-16"],["T0810","Data Historian Compromise","G",[14],["M0942","M0930","CM1207","CM1223","CM2102","CM2104"],[43,40,31,41,14,42,87,17,18,2,15,8,9,10,39],"G-1"],["T0817","Drive-by Compromise","G",[14],["M0948","M0950","CM1223","CM2102","CM2103"],[31,32,33,34,35,186,113,36,8,2,15,9,10,37],"G-1"],["T0818","Engineering Workstation Compromise","G",[14],["M0947","M0941","M0930","CM1207","CM1223","CM2102","CM2104"],[60,61,102,180,5,40,31,41,42,87,17,187,18,2,15,8,9,10,39],"G-1"],["T0819","Exploit Public-Facing Application","G",[14],["M0948","M0930","M0926","CM1201","CM1202","CM2104"],[31,32,33,34,35,40,87,42,86,0,2,14,39],"G-1"],["T0866","Exploitation of Remote Services","G",[14,20],["M0948","M0942","M0950","M0930","M0926","M0919","CM1202","CM2103","CM2147"],[31,32,34,35,43,36,8,113,40,142,41,42,87,86,19,114,2,14,0,37,89,48],"G-1, G-7"],["T0822","External Remote Services","G",[14],["M0942","M0930","CM1226","CM1227","CM2104"],[43,31,40,41,14,42,44,108,45,46,39],"G-1"],["T0883","Internet Accessible Device","G",[14],["M0930","CM1202","CM2104"],[31,40,41,14,42,2,0,39],"G-1"],["T0886","Remote Services","G",[14,20],["M0800","M0801","M0930","CM1202","CM1208","CM1253","CM2118"],[188,84,3,31,40,41,14,42,2,0,80,55,147,72,90],"G-1, G-7"],["T0847","Replication Through Removable Media","G",[14],["M0942","M0928","CM1209","CM2108"],[43,55,52],"G-1"],["T0848","Rogue Master","G",[14],["M0802","M0807","M0930","M0937","CM1207","CM1223","CM2102"],[96,136,3,129,31,40,41,14,42,84,17,187,18,2,15,8,9,10],"G-1"],["T0865","Spearphishing Attachment","G",[14],["CM1201","CM1259","CM2141"],[0,11,16,12,48],"G-1"],["T0862","Supply Chain Compromise","G",[14],["M0945","M0947","M0916","CM1262","CM2109","CM2110","CM2111","CM1205"],[60,62,73,64,65,66,97,189,57,190,27,28,22,29,30,61,58,63,59,191],"G-1"],["T0860","Wireless Compromise","G",[14],["M0802","M0808","M0813","M0806"],[96,136,99,3,53,192],"G-1"],["T0858","Change Operating Mode","G",[15,18],["M0800","M0801","M0930","CM1204","CM2144"],[117,84,3,40,41,42,87,2,8,193,9],"G-2, G-5"],["T0807","Command-Line Interface","G",[15],["M0942","M0938","CM1204","CM2138"],[43,75,2,8,48],"G-2"],["T0871","Execution through API","G",[15],["M0800","M0801","M0938","CM2122"],[117,84,3,43,8],"G-2"],["T0823","Graphical User Interface","G",[15],["CM1204"],[2],"G-2"],["T0874","Hooking","G",[15,17],["M0944","M0947","CM2105"],[194,75,62,60,97,189,73,37,49],"G-2, G-4"],["T0821","Modify Controller Tasking","G",[15],["M0947","M0945","CM1204"],[62,60,97,189,73,61,2],"G-2"],["T0834","Native API","G",[15],["M0938","CM2122"],[43,8],"G-2"],["T0853","Scripting","G",[15],["M0948","M0942","M0938","CM1204","CM2129"],[31,32,34,35,43,75,2,8,9,48],"G-2"],["T0863","User Execution","G",[15],["M0945","M0938","M0921","CM1259","CM2120"],[62,60,73,76,43,75,36,11,16,12,8,9],"G-2"],["T0889","Modify Program","G",[16],["M0947","M0945","CM1204"],[60,61,62,73,2],"G-3"],["T0839","Module Firmware","G",[16,24],["M0808","M0801","M0946","M0945","M0941","M0930","M0947","CM1254"],[136,3,101,60,61,102,180,62,73,64,65,58,5,40,142,41,14,87,103,97],"G-3, G-11"],["T0873","Project File Infection","G",[16],["M0945","M0941","M0922","M0947","CM1204","CM1237"],[60,61,97,5,85,2],"G-3"],["T0857","System Firmware","G",[16,23],["M0808","M0801","M0946","M0945","M0941","M0930","M0937","M0947","CM1254"],[136,3,101,60,61,102,180,62,97,73,64,65,66,5,40,142,41,14,87,36,103,195,196],"G-3, G-10"],["T0859","Valid Accounts","G",[16,20],["M0915","M0926","M0918","M0947","CM1201","CM2113"],[71,86,98,0,1,72,49],"G-3, G-7"],["T0890","Exploitation for Privilege Escalation","G",[17],["M0948","M0950","M0919","CM1201","CM1234","CM2103"],[31,32,34,35,36,8,113,19,114,0,1,83,37],"G-4"],["T0820","Exploitation for Evasion","G",[18],["M0948","M0926","M0950","M0919"],[31,32,34,35,86,113,36,8,19,114],"G-5"],["T0872","Indicator Removal on Host","G",[18],["M0922","CM1204","CM2133"],[85,2,8,9],"G-5"],["T0849","Masquerading","G",[18],["M0945","M0938","M0922","CM1204","CM2133"],[60,61,97,73,43,75,85,2,8,9,100],"G-5"],["T0851","Rootkit","G",[18,23],["M0945","M0947","CM1204","CM2144"],[60,61,97,189,73,2,8,9,62],"G-5, G-10"],["T0856","Spoof Reporting Message","G",[18,24],["M0802","M0807","M0930","M0937","CM1204","CM2102"],[96,136,3,129,41,14,87,84,2,8,9,10],"G-5, G-11"],["T0840","Network Connection Enumeration","G",[19],["CM1204","CM1260","CM2115"],[2,4,6,7,8,9],"G-6"],["T0842","Network Sniffing","G",[19],["M0808","M0932","M0930","M0926","CM1201","CM1226","CM1248","CM2117"],[136,140,41,14,42,86,0,1,44,137,6,135],"G-6"],["T0846","Remote System Discovery","G",[19],["M0930","CM1204","CM1260","CM2115"],[40,31,41,42,2,4,6,7,8,9],"G-6"],["T0888","Remote System Information Discovery","G",[19],["M0930","CM1260","CM2115"],[40,31,41,42,4,6,7,8,9],"G-6"],["T0887","Wireless Sniffing","G",[19,21],["M0808","M0806"],[136,192],"G-6, G-8"],["T0812","Default Credentials","G",[20],[],[],"G-7"],["T0867","Lateral Tool Transfer","G",[20],["M0931","CM1202","CM2133"],[10,197,2,14,0,8,100],"G-7"],["T0843","Program Download","G",[20],["M0800","M0945","M0930","M0937","M0947","CM1204"],[117,188,60,61,97,40,142,41,14,36,62,189,73,2],"G-7"],["T0802","Automated Collection","G",[21],["M0930","CM1201","CM1204","CM2103"],[40,31,41,14,42,87,0,1,2,37],"G-8"],["T0811","Data from Information Repositories","G",[21],["M0941","M0926","M0922","M0918","M0947","CM1201","CM2121"],[5,86,85,71,0,1,37,8],"G-8"],["T0868","Detect Operating Mode","G",[21],["M0800","M0802","M0930","CM1204"],[193,117,84,96,136,3,40,41,14,87,2],"G-8"],["T0877","I/O Image","G",[21],["CM2102","CM1204"],[8,9,10,2],"G-8"],["T0830","Man in the Middle","G",[21],["M0810","M0813","M0942","M0930","CM2102"],[198,60,53,43,41,14,42,8,10,158],"G-8"],["T0801","Monitor Process State","G",[21],["CM2102"],[8,10,158],"G-8"],["T0861","Point & Tag Identification","G",[21],["M0802","M0930","CM1201","CM1204"],[96,136,3,40,41,14,87,0,1,2],"G-8"],["T0845","Program Upload","G",[21],["M0800","M0930","M0937","CM1204","CM2102"],[117,188,40,142,41,14,87,36,2,8,10],"G-8"],["T0852","Screen Capture","G",[21],["CM2120","CM2105"],[8,9,37,49],"G-8"],["T0885","Commonly Used Port","G",[22],["M0942","M0931","M0930","CM2102","CM2141"],[43,10,197,40,31,41,42,8,157,158],"G-9"],["T0884","Connection Proxy","G",[22],["M0931","M0920"],[10,197,8,157,158],"G-9"],["T0869","Standard Application Layer Protocol","G",[22],["M0930","CM2102","CM2141"],[40,31,41,42,8,10,157,158],"G-9"],["T0800","Activate Firmware Update Mode","G",[23],["M0800","M0930","CM2144"],[117,84,40,41,14,87,8],"G-10"],["T0878","Alarm Suppression","G",[23],["M0930","M0810","CM2144"],[40,142,41,14,87,198,8,9],"G-10"],["T0803","Block Command Message","G",[23],["M0810","CM2144"],[198,8,9],"G-10"],["T0804","Block Reporting Message","G",[23],["M0810","CM2102","CM2144"],[198,8,9,10],"G-10"],["T0805","Block Serial COM","G",[23],["M0810","CM2144"],[198,8,9],"G-10"],["T0809","Data Destruction","G",[23],["M0926","M0922","M0953","CM1230","CM1222","CM1242","CM2115"],[86,85,164,165,57,61,166,167,168,60,40,36,80,172,8,9],"G-10"],["T0814","Denial of Service","G",[23],["M0815","CM1204","CM1247"],[199,2,79,178,179],"G-10"],["T0816","Device Restart/Shutdown","G",[23],["M0942","M0800","M0802","M0801","M0930","CM2144"],[43,117,84,96,136,3,40,41,42,87,8,9],"G-10"],["T0835","Manipulate I/O Image","G",[23],["CM1204"],[2],"G-10"],["T0838","Modify Alarm Settings","G",[23],["M0800","M0801","M0930","CM2144"],[117,84,3,40,41,42,87,8,9],"G-10"],["T0881","Service Stop","G",[23],["M0930","M0922","M0924","M0918","CM2144"],[40,142,41,42,87,85,71,8,9],"G-10"],["T0806","Brute Force I/O","G",[24],["M0930","M0937","CM1208","CM2147"],[40,41,14,87,79,200,80,55,8,89,48],"G-11"],["T0836","Modify Parameter","G",[24],["M0800","M0947","CM1204","CM1237","CM1255","CM2106"],[117,188,60,61,97,189,2,99,174,29],"G-11"],["T0855","Unauthorized Command Message","G",[24],["M0802","M0807","M0930","M0937","CM1204","CM2102"],[96,136,3,129,41,14,87,84,2,8,9,10],"G-11"],["T0879","Damage to Property","G",[25],["M0805","M0812","CM1222","CM1275","CM1276","CM1277"],[99,201,202,109,41,3,166,167,168,60,61,80,81,203,204,172,205],"G-12"],["T0813","Denial of Control","G",[25],["M0810","M0811","M0953","CM1245","CM1275","CM1276","CM1277"],[198,164,206,165,40,36,80,172,173,81,175,176,55,168,154,3,203,204],"G-12"],["T0815","Denial of View","G",[25],["M0810","M0811","M0953","CM1245"],[198,164,206,165,40,36,80,172,173,81,175,176,55,168,154],"G-12"],["T0826","Loss of Availability","G",[25],["M0810","M0811","M0953","CM1245","CM1247"],[198,164,206,165,40,36,80,172,173,81,175,176,55,168,154,178,179],"G-12"],["T0827","Loss of Control","G",[25],["M0810","M0811","M0953","CM1275","CM1276","CM1277"],[198,164,206,165,40,36,80,172,173,81,3,203,204,205],"G-12"],["T0828","Loss of Productivity and Revenue","G",[25],["M0953","CM1222","CM1277"],[164,165,173,166,167,168,60,61,204,172,205],"G-12"],["T0837","Loss of Protection","G",[25],["CM2124"],[207],"G-12"],["T0880","Loss of Safety","G",[25],["M0805","M0812","CM2124"],[99,201,208,202,109,41,3,207],"G-12"],["T0829","Loss of View","G",[25],["M0810","M0811","M0953"],[198,164,206,165,40,36,80,172,173],"G-12"],["T0831","Manipulation of Control","G",[25],["M0802","M0810","M0953","CM1245","CM1275","CM1276","CM1277"],[96,136,3,198,164,165,173,81,175,176,80,55,168,154,203,204,172],"G-12"],["T0832","Manipulation of View","G",[25],["M0802","M0810","M0953"],[96,136,3,198,164,165,173],"G-12"],["T0882","Theft of Operational Information","G",[25],["M0809","M0803","M0941","M0922","CM1201"],[6,36,161,5,85,0],"G-12"]],"RISKS":[["0a21dc94","A password on its own reaches WS-X90 at the flightline","critical","moderate","high",["T1078","T1110"]],["d3902bc5","Payload arm and release records become unverifiable as signing keys rotate","critical","moderate","high",["T1553","T1565"]],["7ddbc65b","A hand-kept bay list leaves standing physical access to key and recovery material","high","moderate","high",["T1200","T1552"]],["5828fe17","A partition that has failed its own integrity check keeps flying the mission","high","moderate","high",["T1542","T1601"]],["79e3025e","An unsealed service connector leaves a physical route into the maintenance path","high","moderate","high",["T1091","T1200"]],["ccc13a34","Low-rate exhaustion and unattributable egress at the WS-X90 external boundary","high","moderate","high",["T1048","T1499"]],["4cb2d6a3","Risk arising from REQ-008","high","moderate","high",[]],["d7e16faf","Risk arising from REQ-039","high","moderate","high",[]],["ec94501b","Risk arising from REQ-068","high","moderate","high",[]],["146be363","Risk arising from REQ-100","high","moderate","high",[]],["602c1b5d","The mission link is unmonitored and three firmware domains cannot force the restricted state","high","moderate","high",["T1040","T1495"]],["d726f6b1","The payload interlock's trust basis is asserted and six units identify themselves from paperwork","high","moderate","high",["T1036","T1195"]],["c9f087a6","A disallowed session survives at the boundary while field procedures go unsigned","moderate","moderate","moderate",["T1133","T1563"]],["1a0778b3","A publicly known password is still a valid WS-X90 credential","moderate","moderate","moderate",["T1078","T1110"]],["579ecff1","A scan on a stale signature set reports clean and the program acts on it","moderate","moderate","moderate",["T1562"]],["d0c7d0ad","Insider threat and spillage have an escalation path and no named owner","moderate","moderate","moderate",["T1005","T1052"]],["065fc910","Payload telemetry maintenance happens outside the work-order gate","moderate","moderate","moderate",["T1021"]],["85db8319","Platform telemetry crosses to a party nobody has signed a responsibility split with","moderate","moderate","moderate",["T1020","T1199"]],["4fad3c91","Privilege that survived its own review still reaches platform management","moderate","moderate","moderate",["T1078","T1098"]],["a4e6d677","Risk arising from REQ-024","moderate","high","high",[]],["54a7538a","Risk arising from REQ-032","moderate","low","moderate",[]],["a69bb505","Risk arising from REQ-053","moderate","high","high",[]],["8393c795","Risk arising from REQ-062","moderate","low","moderate",[]],["54e57a74","Risk arising from REQ-083","moderate","high","high",[]],["03162c69","Risk arising from REQ-092","moderate","low","moderate",[]],["25938cff","Risk arising from REQ-114","moderate","high","high",[]],["41330f8c","Risk arising from REQ-119","moderate","low","moderate",[]],["c6f53950","The four-hour recovery objective has never been measured on a whole article","moderate","moderate","moderate",["T1485","T1490"]],["576c965f","The widest configuration divergence WS-X90 produces has no review behind it","moderate","moderate","moderate",["T1601"]],["ba874b40","Weakness reports reach their second recipient after the reporting bound","moderate","moderate","moderate",[]],["a5f7ee46","Out-of-window privileged maintenance was recorded rather than refused","low","low","low",["T1021","T1078"]],["f659e4b2","Out-of-work-order privileged tool use was recorded and never surfaced","low","low","low",["T1070","T1072"]],["23c37f1c","Primary and alternate bearers converge on one switch port group","low","low","low",["T1498"]],["c23dcfa0","Relayed audit records carried a second ordering inside the platform trail","low","low","low",["T1070","T1565"]],["39802516","Risk arising from REQ-015","low","moderate","moderate",[]],["8974368f","Risk arising from REQ-045","low","moderate","moderate",[]],["f644b3d4","Risk arising from REQ-074","low","moderate","moderate",[]],["4cefa004","Risk arising from REQ-109","low","moderate","moderate",[]],["a7e6c40b","The personnel procedure and the provisioning gate no longer agree","low","low","low",["T1078","T1136"]],["0ec14b7b","Unlisted hardware was announced onto the internal segment and then carried","low","low","low",["T1200","T1557"]]],"ISS":[["1f680dd7","Payload arm and release commands signed under a rotated key cannot be verified at all (AU-10)","critical","2026-10-21","AU-10"],["a4823e25","Disconnected Maintenance Laptop still offers a password-only logon on the flightline (IA-2(2))","critical","2026-11-13","IA-2(2)"],["85973641","Unmet requirement REQ-100","high","2026-08-07","CM-4"],["e9c669c2","Unmet requirement REQ-008","high","2026-08-10","AC-11"],["28b99485","Unmet requirement REQ-068","high","2026-08-13",""],["a76a9dc1","Session-table occupancy missing from the gateway counter export, leaving low-rate state exhaustion undetectable (SC-5(3))","high","2026-09-24","SC-5(3)"],["4d5a5dfc","Mission data sessions over the tactical radio never presented to platform monitoring (SI-4(10))","high","2026-10-02","SI-4(10)"],["e4560090","Egress denial records attribute maintenance-origin traffic to a device instead of an operator (SC-7(9))","high","2026-10-04","SC-7(9)"],["77d97586","Payload Safety Interlock carries an asserted trustworthiness basis with no supplier assurance case (SA-8(9))","high","2026-10-08","SA-8(9)"],["6578da17","Maintenance Access Gateway service connector locked but unsealed, so an unauthorized connection leaves no trace (SC-7(14))","high","2026-10-09","SC-7(14)"],["c0fdce4e","CVE-2024-6387 in the OpenSSH server (regreSSHion)","high","2026-10-10",""],["cc34d8ab","Protected bay access list transcribed by hand, so a facility removal leaves bay access standing (PE-3(1))","high","2026-10-19","PE-3(1)"],["f40812b7","Navigation, timing and payload firmware violations raise an alert without driving the restricted state (SI-7(5))","high","2026-10-31","SI-7(5)"],["963823be","In-partition failures never reach the Secure Boot Controller, so the platform does not enter its defined secure state (SC-24)","high","2026-11-05","SC-24"],["fee2cf4d","Unmet requirement REQ-119","moderate","2026-08-07",""],["4264643b","Unmet requirement REQ-024","moderate","2026-08-07","CM-2"],["c772d10a","Unmet requirement REQ-062","moderate","2026-08-07","SC-28"],["9f9fbd16","Unmet requirement REQ-083","moderate","2026-08-09","AC-12"],["42eedb4e","Unmet requirement REQ-032","moderate","2026-08-15","CM-11"],["42b96885","Unmet requirement REQ-053","moderate","2026-08-17","RA-3"],["1f77e9bd","Unmet requirement REQ-092","moderate","2026-08-18","AU-11"],["c9ad506f","Expired acquisition procedures can still be cited in a live procurement package (SA-1)","moderate","2026-09-16","SA-1"],["f0ff0fae","Monitoring and boot-integrity enhancement procedures still marked draft in the signed SI set (SI-1)","moderate","2026-10-01","SI-1"],["b0f430d2","Incident response procedures name no insider-threat branch or spillage roles after the scope expansion (IR-1)","moderate","2026-10-07","IR-1"],["0d7e1855","Seven access control procedures in field packages carry no current owner signature (AC-1)","moderate","2026-10-24","AC-1"],["ac339ae5","UDP-bearing approved tunnel outlives a failed inspection past the five-second termination bound (AC-4(4))","moderate","2026-10-25","AC-4(4)"],["9bdc5d1b","Unreconfirmed privileged assignments flagged on the Platform Management Controller but never reduced (AC-6(7))","moderate","2026-10-26","AC-6(7)"],["942ef213","Recovery exercise restored one partition, leaving the four-hour objective unproven for the article (CP-4)","moderate","2026-10-30","CP-4"],["ec5d8c5f","Two of four weakness reports reached the second recipient past the five-working-day bound (IR-6(2))","moderate","2026-11-03","IR-6(2)"],["b3646a99","Baseline scan ran to completion on a thirty-hour-old signature set without aborting (RA-5(2))","moderate","2026-11-04","RA-5(2)"],["fe939b44","Four of eleven configuration management procedures unsigned and flagged review-overdue (CM-1)","moderate","2026-11-07","CM-1"],["315fbe31","Payload Telemetry Unit maintained on retrospective paperwork outside the work-order gate (MA-2(2))","moderate","2026-11-08","MA-2(2)"],["d054753e","Post-campaign change review has no trigger and runs only when somebody remembers (CM-3(7))","moderate","2026-11-08","CM-3(7)"],["ab332f61","Six LRUs fall back to a maintenance-record serial number for hardware identity at power-on (SA-10(3))","moderate","2026-11-09","SA-10(3)"],["cf162cda","Timing Receiver port admitted to the mission VLAN on a one-sided certificate exchange (IA-3(1))","moderate","2026-11-13","IA-3(1)"],["ecb1e2a1","Ground-support telemetry exchange carrying traffic on an interim approval with no signed agreement (CA-3)","moderate","2026-11-13","CA-3"],["b61b983c","Compromised-password screening list refreshed ad hoc, so an accepted credential may already be public (IA-5(1))","moderate","2026-11-14",""],["82ba14e2","Unmet requirement REQ-045","low","2026-08-09","MA-3"],["ac70a0fd","Unmet requirement REQ-109","low","2026-08-16","CP-10"],["8c7f42de","Unmet requirement REQ-015","low","2026-08-17","AU-6"],["81ab0471","SC policy baseline carries an issue date but no recorded review decision in the Configuration Repository (SC-1)","low","2026-09-23","SC-1"],["f24ba0a0","Personnel security procedure describes weaker gating than the Provisioning Workstation enforces (PS-1)","low","2026-10-11","PS-1"],["29919692","Audit procedures still written to the original 74-control scope in the Configuration Repository (AU-1)","low","2026-10-13","AU-1"],["55517d12","Primary and alternate bearers converge on one Internal Ethernet Switch port group (CP-8(2))","low","2026-10-31","CP-8(2)"]],"POAM":[["0344afc0","Remediate REQ-024","in_progress",3,"4264643b"],["ccb452ad","Remediate REQ-045","in_progress",3,"82ba14e2"],["96e50cb7","Remediate REQ-068","in_progress",3,"28b99485"],["d1f095da","Remediate REQ-092","in_progress",3,"1f77e9bd"],["a99b735e","Remediate REQ-114","completed",0,"4a718961"],["04339e87","Remediate REQ-008","in_progress",3,"e9c669c2"],["217100a1","Remediate REQ-032","in_progress",3,"42eedb4e"],["7f342a9e","Remediate REQ-053","in_progress",3,"42b96885"],["c674a57a","Remediate REQ-074","completed",0,"7813f01e"],["4be4ddde","Remediate REQ-100","in_progress",3,"85973641"],["cb6336b6","Remediate REQ-119","in_progress",3,"fee2cf4d"],["bd54cb23","Remediate REQ-015","in_progress",3,"8c7f42de"],["1c554589","Remediate REQ-039","completed",0,"fdb85e36"],["75421dca","Remediate REQ-062","in_progress",3,"c772d10a"],["ca8301dc","Remediate REQ-083","in_progress",3,"9f9fbd16"],["96bd4063","Remediate REQ-109","in_progress",3,"ac70a0fd"],["dccc2343","Order the compiled audit trail on source time","completed",3,"d370ad92"],["9a43f6a8","Block out-of-window privileged commands at the maintenance gateway","completed",3,"0299f647"],["def9d690","Remediate CVE-2024-6387 on the Mission Computer","open",3,"c0fdce4e"],["20b24018","Refuse unlisted hardware on every switch port","completed",3,"884b66de"],["1e855acc","Alert on privileged tool use outside an open work order","completed",3,"fe5baef3"],["7d023346","Automate the second reporting route for weakness reports","in_progress",3,"ec5d8c5f"],["03c0317f","Publish the retired key history and reissue the audit direction","in_progress",3,"29919692"],["2647a7d2","Put compromised-credential screening on a scheduled refresh","in_progress",3,"b61b983c"],["6c99b283","Exercise a whole-article recovery against the four-hour objective","in_progress",3,"942ef213"],["08b61d0b","Restore state-level visibility and operator attribution at the boundary gateway","in_progress",4,"81ab0471"],["875a2892","Seal the maintenance service connector and confirm the interface inventory","in_progress",3,"6578da17"],["24b7225c","Make the privileged access review reduce privilege by itself","in_progress",4,"9bdc5d1b"],["4d7b5e23","Gate payload telemetry maintenance instead of recording it afterwards","in_progress",3,"315fbe31"],["e2f0b4d9","Sign the ground-support telemetry agreement before the exchange continues","in_progress",4,"ecb1e2a1"],["f4938b99","Abort a baseline scan on a stale signature set","in_progress",3,"b3646a99"],["aedcd7ce","Derive bay access from the facility roster and export the reader log","in_progress",4,"cc34d8ab"],["e35d68ed","Reissue the personnel security procedure to match enforced gating","in_progress",3,"f24ba0a0"],["c1f073e7","Terminate failed-inspection sessions and reissue the unsigned access procedures","in_progress",3,"0d7e1855"],["65d17707","Remove the password-only path and make the switch exchange mutual","in_progress",4,"a4823e25"],["de5e5c65","Close the mission-link monitoring blind spot and widen the restricted-state trigger","in_progress",4,"f0ff0fae"],["8b91a4ee","Trigger the post-campaign reconciliation and sign the outstanding procedures","in_progress",3,"fe939b44"],["866eeaad","Re-home the alternate bearer off the shared port group","in_progress",4,"55517d12"],["1e65bd58","Evidence the interlock trust basis and fit provisioned hardware identity","in_progress",3,"c9ad506f"],["0ad5eb72","Add insider-threat and spillage handling to the incident procedures","in_progress",4,"b0f430d2"],["f07580fc","Route in-partition failures into the platform secure state","in_progress",4,"963823be"]],"REQS":[["REQ-001","AC Enforcement Requirement 001",["AC-2","AC-7"]],["REQ-002","AC Verification Requirement 002",["AC-3"]],["REQ-003","AC Configuration Requirement 003",["AC-4"]],["REQ-004","AC Monitoring Requirement 004",["AC-5"]],["REQ-005","AC Enforcement Requirement 005",["AC-6"]],["REQ-006","AC Verification Requirement 006",["AC-7"]],["REQ-007","AC Configuration Requirement 007",["AC-8"]],["REQ-008","AC Monitoring Requirement 008",["AC-11","AU-4"]],["REQ-009","AC Enforcement Requirement 009",["AC-12"]],["REQ-010","AC Verification Requirement 010",["AC-17"]],["REQ-011","AU Configuration Requirement 011",["AU-2"]],["REQ-012","AU Monitoring Requirement 012",["AU-3"]],["REQ-013","AU Enforcement Requirement 013",["AU-4"]],["REQ-039","IA Configuration Requirement 039",["IA-5"]],["REQ-054","RA Verification Requirement 054",["RA-5"]],["REQ-064","SI Monitoring Requirement 064",["SI-10","SI-2"]],["REQ-200","Boundary counters exported and alerted on connection-rate excursions",["SC-5(3)"]],["REQ-262","Outbound traffic profiled per mission phase for anomalies",["SI-4(11)","SI-4(13)"]],["REQ-353","On-demand audit reduction that does not alter the source records",["AU-7"]],["REQ-360","Payload arm and release commands are signed at origin",["AU-10"]],["REQ-361","Signing key custody and signature verification on ingest",["AU-10"]],["REQ-436","Access control policy and procedure baseline held under signature",["AC-1"]],["REQ-439","Platform accounts disabled within 72 hours of expiry, disassociation or violation",["AC-2(3)"]],["REQ-442","Technicians log out at the end of the standard work period",["AC-2(5)"]],["REQ-443","Platform privilege is carried by named roles, never attached to an account",["AC-2(7)"]],["REQ-599","Hardware credential and PIN for non-privileged ground support sessions",["IA-2(2)"]]],"EV":[["m1","Remote command authentication tag verification test report, LRU-008 and LRU-010 discard counters","Test record","pending"],["m2","Clock synchronisation test report, LRU-005 reference against LRU-001 and LRU-012, four-hour run","Test record","pending"],["m3","Maintenance session cipher negotiation test report, LRU-003, LRU-007 and LRU-014","Test record","pending"],["m4","Unauthorised firmware detection and function isolation test, LRU-002 and LRU-013","Scan","pending"],["m5","Sanitisation and contamination-trace procedure, LRU-015 region clearing and LRU-020 baseline query","Document","pending"],["b1","PIV path build and revocation check test report, LRU-017 and LRU-019","Test record","needs_revision"],["b2","External exchange agreement register with interim-approval exceptions","Document","needs_revision"],["b3","Non-privileged authentication method inventory, LRU-019 and LRU-017 baselines","Test record","needs_revision"],["b4","Switch port authentication state export, LRU-009 with LRU-002 boot measurement bindings","Dataset","needs_revision"],["b5","Privileged maintenance tool invocation log extract, LRU-014 to LRU-018","Document","needs_revision"],["b6","Remote privileged command admission test report, approved list, attestation and window checks","Test record","needs_revision"],["a1","Key store containment test report, LRU-003 export attempts and handle-only interface trace","Test record","accepted"],["a2","Replay resistance test report, LRU-007 gateway and LRU-008 link authentication","Test record","accepted"],["a3","Separate-device factor test report, LRU-014 and LRU-019 local, network and remote paths","Test record","accepted"],["a4","Receiving inspection attestations, 24 units of LRU-004 / LRU-006 / LRU-008","Document","accepted"],["a5","IA policy and IA procedure set, revision 2.4, signed export with review-flag report","Document","accepted"],["a6","Privileged two-factor enforcement test report, LRU-013 and LRU-014, build 4.2.1","Test record","accepted"]]};
  const EX = '<span class="ex">Example</span>';
  const ME = "Ingrid Solberg";

  // ——— Small parts ———
  const route = () => (location.hash || "#home").slice(1);
  const has = (r) => typeof S[r] === "function";
  // A route another version-8 builder draws: link it when it exists in this build, else the closest screen that does.
  const pick = (...rs) => rs.find(has) || "home";
  const btn = (label, attrs = "", ink = false) => `<button type="button" class="btn sm${ink ? " ink" : ""}" ${attrs}>${label}</button>`;
  const lk = (label, r, attrs = "") => `<span class="v8w-a" role="link" tabindex="0" data-go="${esc(r)}" ${attrs}>${label}</span>`;
  const mu = (t) => `<span class="v8w-mu">${t}</span>`;
  const num = (n) => `<span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>`;
  const plural = (n, w, ws) => `${fmt(n)} ${n === 1 ? w : ws || w + "s"}`;
  const code = (c) => `<span class="ak-code">${esc(c)}</span>`;
  const tr = (s, w) => `<span class="v8w-tr" style="max-width:${w}px" title="${esc(s)}">${esc(s)}</span>`;
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
  const andList = (l) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} and ${l[l.length - 1]}`);
  const kv = (rows) => `<dl class="ak-kv">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join("")}</dl>`;
  const redraw = () => { const m = document.getElementById("main"), r = route(); if (m && has(r)) { const y = m.scrollTop; m.innerHTML = S[r](); m.scrollTop = y; } };
  const toast = (text, link, to) => {
    const el = SSP.ui.toast(text, link), l = el && el.querySelector(".ak-link");
    if (l && to) { l.setAttribute("role", "link"); l.tabIndex = 0; const f = () => { location.hash = to; el.remove(); }; l.addEventListener("click", f); l.addEventListener("keydown", (e) => { if (e.key === "Enter") f(); }); }
    return el;
  };
  const closeModal = () => { const x = document.querySelector("#modal [data-close-modal]"); if (x) x.click(); };
  function tbl({ cols, rows, total, panel = "", label = "", cls = "", pager = true, empty = "Nothing matches this view." }) {
    const body = rows.length ? rows.map((r) => {
      if (r.raw) return `<tr class="v8w-grp${r.cls ? " " + r.cls : ""}">${r.raw}</tr>`;
      const pk = r.panel !== undefined ? r.panel : panel;
      const at = r.go ? ` data-go="${esc(r.go)}" tabindex="0"` : pk ? ` data-panel="${esc(pk)}" data-id="${esc(r.id == null ? "" : r.id)}" tabindex="0"` : "";
      return `<tr${r.cls ? ` class="${r.cls}"` : ""}${at}>${r.cells.map((c, i) => `<td${i ? "" : ' class="nm"'}>${c}</td>`).join("")}</tr>`;
    }).join("") : `<tr class="v8w-grp"><td colspan="${cols.length}">${mu(esc(empty))}</td></tr>`;
    const shown = rows.filter((r) => !r.raw).length;
    return `<div class="frame v8w-frame ${cls}"><div class="tablebox"><table${label ? ` aria-label="${esc(label)}"` : ""}><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>${pager ? `<div class="pager"><span class="num">${shown ? `1–${fmt(shown)} of ${fmt(total == null ? shown : total)}` : "0 shown"}</span><span>${(total || 0) > 25 ? "25 per page · ‹ ›" : ""}</span></div>` : ""}</div>`;
  }
  const QV = {};
  const chips = (key, list, label = "Quick views") => { const on = QV[key] || list[0][0]; return `<div class="views v8w-views" role="group" aria-label="${esc(label)}">${list.map(([v, l, n]) => `<button type="button" class="qv${on === v ? " on" : ""}" aria-pressed="${on === v}" data-v8w-q="${esc(key)}" data-v8w-v="${esc(v)}">${esc(l)}${n !== undefined ? ` <span class="num">${typeof n === "number" ? fmt(n) : esc(n)}</span>` : ""}</button>`).join("")}</div>`; };
  const filters = (search, list, end = "") => `<div class="tools v8w-tools"><span class="in">${esc(search)}</span>${list.map((f) => `<span class="flt">${esc(f)} ⌄</span>`).join("")}<span class="flt sub">+ Add filter</span>${end ? `<span class="v8w-push">${end}</span>` : ""}</div>`;
  const REQ = ' <span class="req">Required</span>', OPT = ' <span class="opt">Optional</span>';
  const field = (label, control, flag = "", hint = "") => `<div class="ak-field v8w-field"><span class="v8w-lbl">${esc(label)}${flag}</span>${control}${hint ? `<span class="s">${hint}</span>` : ""}</div>`;
  const input = (name, value, label, ph = "") => `<input class="v8w-in" type="text" name="${name}" value="${esc(value)}" aria-label="${esc(label)}" placeholder="${esc(ph)}" autocomplete="off">`;
  const area = (name, value, label, ph = "") => `<textarea class="v8w-in tall" name="${name}" aria-label="${esc(label)}" placeholder="${esc(ph)}">${esc(value)}</textarea>`;
  const select = (name, opts, sel, label) => `<select class="v8w-in" name="${name}" aria-label="${esc(label)}">${opts.map((o) => `<option${o === sel ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  const radio = (name, value, label, on, hint = "") => `<label class="v8w-opt"><input type="radio" name="${name}" value="${esc(value)}"${on ? " checked" : ""}><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span></label>`;
  const check = (name, label, on, hint = "") => `<label class="v8w-opt"><input type="checkbox" name="${name}"${on ? " checked" : ""}><span><b>${label}</b>${hint ? `<small>${hint}</small>` : ""}</span></label>`;
  const submitFoot = (primary, kind, id = "") => `<button type="button" class="btn" data-close-modal>Cancel</button><button type="button" class="btn ink" data-v8w-submit="${esc(kind)}" data-id="${esc(id)}">${esc(primary)}</button>`;
  const err = (t) => `<p class="v8w-err" role="alert" hidden>${esc(t)}</p>`;
  const sw = (on, label, key) => `<button type="button" class="v8w-sw${on ? " on" : ""}" role="switch" aria-checked="${!!on}" aria-label="${esc(label)}" data-v8w-sw="${esc(key)}"></button>`;
  const line = (t) => `<p class="v8w-line">${t}</p>`;
  const sec = (title, body, opt = {}) => AK.section(title, body, opt);
  const li = (lead, x, end = "", attrs = "") => `<div class="v8w-li"${attrs ? " " + attrs : ""}><span class="v8w-lead">${lead}</span><span class="v8w-lx">${x}</span>${end ? `<span class="v8w-le">${end}</span>` : ""}</div>`;
  const STATUS = SSP.STATUS, ctl = (c) => SSP.ctl(c);
  const csPill = (c) => { const x = ctl(c); return x ? pill(STATUS[x.cs][1], STATUS[x.cs][0]) : `<span class="v8w-mu">Not in the baseline</span>`; };
  const slug = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  // Open a record's panel on its register: the row if the register shows it, else a stand-in the core can open it from.
  function openPanelVia(kind, id) {
    const main = document.getElementById("main"); if (!main) return;
    let el = [...main.querySelectorAll(`[data-panel="${kind}"]`)].find((x) => x.dataset.id === id);
    if (!el) { el = document.createElement("span"); el.className = "v8w-stand"; el.dataset.panel = kind; el.dataset.id = id; el.tabIndex = -1; main.appendChild(el); }
    else if (el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    el.click();
  }
  function doOpen(a) {
    if (!a || !a.go) return;
    const finish = () => { if (a.panel) openPanelVia(a.panel, a.id); else { const m = document.getElementById("main"); if (m) m.focus({ preventScroll: true }); } };
    if (route() === a.go) { finish(); return; }
    const once = () => { window.removeEventListener("hashchange", once); setTimeout(finish, 40); };
    window.addEventListener("hashchange", once);
    location.hash = a.go;
  }
  // data-v8w-open="route|panel|id" goes to a register and opens a record's panel there.
  const opener = (r, panel, id) => `data-v8w-open="${esc([r, panel || "", id || ""].join("|"))}" role="link" tabindex="0"`;

  // ——— Shared WS-X90 records ———
  const RISKS = D8.RISKS.map(([id, t, sev, lik, imp, tech]) => ({ id, t, sev, lik, imp, tech }));
  const ISS = D8.ISS.map(([id, t, sev, opened, c]) => ({ id, t, sev, opened, c }));
  const POAM = D8.POAM.map(([id, t, st, ms, iss]) => ({ id, t, st, ms, iss }));
  const REQS = D8.REQS.map(([id, t, c]) => ({ id, t, c }));
  const EVID = [...data.EVIDENCE.map(([t, k, o, d], i) => ({ id: "e" + (i + 1), t, k, st: "pending" })), ...D8.EV.map(([id, t, k, st]) => ({ id, t, k, st }))];
  const EVST = { pending: "Pending review", needs_revision: "Needs revision", accepted: "Accepted" };
  const SEV = { critical: "Critical", high: "High", moderate: "Moderate", low: "Low" };
  const PST = { in_progress: "In progress", completed: "Completed", open: "Not started", planned: "Planned" };
  const PROGS = [["PRG-1090", "WS-X90 Sentinel Mission System"], ["PRG-2101", "Customer A · X800 Rail Integration"], ["PRG-2102", "Customer B · X800 Palletized Integration"], ["PRG-2201", "Customer C · G25 Battery Control Fielding"], ["PRG-1041", "Atlas payments platform"], ["PRG-1013", "Corporate identity provider"], ["PRG-1007", "Field operations mobile"], ["PRG-0994", "Legacy billing gateway"], ["PRG-1028", "Northwind data warehouse"]];
  const ELS = SSP.elements; // [code, name, type, parent, lru]
  const elName = (c) => (ELS.find((e) => e[0] === c) || [c, c])[1];
  const CHECKS = { scan: "Vulnerability scans run at RA-5's frequency", iava: "IAVA and IAVB patches inside their windows", stig: "No open STIG CAT I; CAT II inside 30 days", sbom: "No known-affected component in use", expiring: "Evidence renewed before it expires", "poam-review": "POA&M reviewed every month", "priv-review": "Privileged accounts reviewed each quarter" };

  // ═════════════ 1. Search everywhere (⌘K): a command palette over the page ═════════════
  // Every nav item, WS-X90's records, people, programs, plans and commands; at most six a group, with "N more" to the register.
  const NAVL = [[null, [["home", "Home"], ["getting-started", "Getting started"], ["my-work", "My work"], ["review-queue", "Review queue"]]],
    ["WS-X90", [["overview", "Overview"], ["itcsc", "ITCSC"]]], ["System", [["composition", "Composition"], ["inventory", "Inventory"], ["stigs", "STIG checklists"], ["interconnections", "Interconnections"], ["ppsm", "Ports & protocols"], ["sources", "Evidence sources"]]],
    ["Compliance", [["baseline", "Baseline"], ["controls", "Controls"], ["ssps", "Plans"], ["requirements", "Requirements"], ["evidence", "Evidence"], ["checks", "Checks"], ["policies", "Policies"]]],
    ["Assess", [["assessments", "Assessments"], ["cyber-te", "Cyber T&E"], ["ai-drafts", "AI agents"]]], ["Risk", [["findings", "Findings"], ["poam", "POA&M"], ["risks", "Risks"], ["risks-library", "Risk library"], ["threats", "Threats"]]],
    ["Analysis", [["posture", "Posture"], ["resiliency", "Cyber resiliency"], ["sse", "Security engineering"], ["traceability", "Traceability"], ["inheritance", "Inheritance"]]],
    ["Authorize", [["authorization", "Authorization"], ["package-room", "Package room"]]], ["Monitor", [["conmon", "Continuous monitoring"], ["schedule", "Schedule"]]],
    ["Organization", [["portfolio", "Portfolio"], ["products", "Products"], ["components", "Components"], ["suppliers", "Suppliers"], ["people", "People"]]],
    ["Library", [["frameworks", "Frameworks & overlays"], ["integrations", "Integrations"], ["data-calls", "Data calls"], ["reports", "Reports & exports"]]],
    ["Settings", [["deadlines", "Deadlines"], ["notifications", "Notifications"], ["event-log", "Event log"], ["enclaves", "Enclaves & markings"], ["common-controls", "Common control providers"], ["permissions", "Roles & permissions"]]],
    ["About", [["study", "Design study"], ["before-after", "Before & after"]]]];
  const NAVICON = { control: "controls", requirement: "requirements", evidence: "evidence", risk: "risks", issue: "findings", poam: "poam", asset: "inventory", campaign: "assessments", person: "people", program: "portfolio", plan: "ssps" };
  // [type, group label, register route for "N more", its label]
  const KG = [["cmd", "Commands"], ["page", "Pages"], ["control", "Controls", "controls", "Controls"], ["requirement", "Requirements", "requirements", "Requirements"], ["evidence", "Evidence", "evidence", "Evidence"],
    ["risk", "Risks", "risks", "Risks"], ["issue", "Operational issues", "findings", "Findings"], ["poam", "POA&M items", "poam", "POA&M"], ["asset", "Assets", "inventory", "Inventory"],
    ["campaign", "Campaigns", "assessments", "Assessments"], ["person", "People", "people", "People"], ["program", "Programs", "portfolio", "Portfolio"], ["plan", "Plans", "ssps", "Plans"]];
  const CMDS = [
    ["Create program", "Start the program setup", "plus", () => ({ go: pick("program-new") }), "Program setup"],
    ["Import an ITCSC", "Read a checklist into WS-X90's boundary", "upload", () => ({ go: pick("itcsc-import", "itcsc", "overview") }), "ITCSC import"],
    ["Import a STIG checklist", ".ckl or .cklb, rule results by CAT", "upload", () => ({ go: pick("stigs", "check-stig") }), "STIG checklists"],
    ["Open the SSP", "SSP 3 · draft · 560 controls", "pen", () => ({ go: pick("ssp") }), "SSP editor"],
    ["Create risk from the library", "ATT&CK techniques and weapon system scenarios", "plus", () => ({ go: "risks-library" }), "Risk library"],
    ["Roles & permissions", "Workspace roles, RMF roles and the permission matrix", "gear", () => ({ go: "permissions" }), "Settings"],
    ["Go to my work", "Your tasks, approvals and what waits on you", "task", () => ({ go: "my-work" }), "My work"],
  ];
  const CTL14 = new Set(["AC-1", "AC-2", "AC-2(5)", "AC-2(7)", "AC-11", "AU-7", "AU-10", "IA-2(2)", "IA-5", "RA-5", "SC-5(3)", "SI-4(13)", "SA-24"]);
  const PEOPLE = (() => {
    const out = new Map(), role = {};
    for (const [, l, n] of SSP.roles) role[n] = l;
    for (const p of SSP.people) out.set(p.name, role[p.name] || p.role);
    for (const [n, r] of SSP.access) out.set(n, role[n] || r);
    return [...out.entries()];
  })();
  let IDX = null;
  function kIndex() {
    if (IDX) return IDX;
    const it = [];
    const add = (t, code, name, sub, to, act, glyph, r) => it.push({ t, code: code || "", name, sub: sub || "", to, act, glyph, r: r || null, key: t + ":" + (code || name), hay: `${code || ""} ${String(code || "").replace(/[^a-z0-9]/gi, "")} ${name} ${sub || ""}`.toLowerCase() });
    CMDS.forEach(([n, s, ic, act, to]) => add("cmd", "", n, s, to, act, AK.i(ic)));
    for (const [g, items] of NAVL) for (const [r, l] of items) add("page", "", l, g || "Work", "Page", () => ({ go: pick(r, "home") }), h.icon(r === "risks-library" ? "risks" : r), r);
    for (const c of SSP.controls) add("control", c.c, c.t, STATUS[c.cs][0], c.c === "SI-2" ? "Control record" : "Controls", c.c === "SI-2" ? { go: "control-si2" } : { go: "controls", panel: CTL14.has(c.c) ? "a-tests-control" : "v7p-obj", id: c.c }, null, c.c === "SI-2" ? "control-si2" : null);
    for (const r of REQS) add("requirement", r.id, r.t, r.c.join(", "), "Requirements", { go: "requirements", panel: "v7p-req", id: r.id });
    for (const e of EVID) add("evidence", "", e.t, `${e.k} · ${EVST[e.st]}`, "Evidence record", () => ({ go: pick("evidence-page-" + e.id, "evidence") }), null, "evidence-page-" + e.id);
    for (const r of RISKS) add("risk", "", r.t, `${SEV[r.sev]}${r.tech.length ? " · " + r.tech.join(" ") : ""}`, "Risks", { go: "risks", panel: "a-risk-risk", id: r.id + "|overview" });
    for (const r of ISS) add("issue", "", r.t, `${SEV[r.sev]} · opened ${AK.md(r.opened)}`, "Findings", { go: "findings", panel: "a-risk-issue", id: r.id });
    for (const r of POAM) add("poam", "", r.t, `${PST[r.st] || cap(r.st)} · ${plural(r.ms, "milestone")}`, "POA&M", { go: "poam", panel: "a-risk-poam", id: r.id + "|overview" });
    for (const e of ELS) if (e[4]) { const id = "AST-109" + e[4].slice(-3); add("asset", id, e[1], `${e[4]} · ${elName(e[3])}`, "Inventory", { go: "inventory", panel: "sys-asset", id }); }
    data.CAMPAIGNS.forEach(([n, st, k, a, b], i) => add("campaign", "", n, `${k} · ${st} · ${AK.md(a)} – ${AK.md(b)}`, i === 0 ? "Assessment" : k === "Cyber test" ? "Cyber T&E" : "Assessments", { go: i === 0 ? "campaign" : k === "Cyber test" ? "cyber-te" : "assessments" }, null, i === 0 ? "campaign" : null));
    for (const [n, r] of [...PEOPLE, ...MEMBERS.filter((m) => !PEOPLE.some(([p]) => p === m.n)).map((m) => [m.n, m.roles[0] ? `${RW[m.roles[0][0]]} · ${m.roles[0][1]}` : "Workspace member"])])
      add("person", "", n, r, "Person", () => (has("person-" + slug(n)) ? { go: "person-" + slug(n) } : { go: "people", panel: "a-people-person", id: n }));
    for (const [c, n] of PROGS) add("program", c, n, c === "PRG-1090" ? "Platform IT · NSS · authorized with conditions" : "Program", c === "PRG-1090" ? "Overview" : "Portfolio", c === "PRG-1090" ? { go: "overview" } : { go: "portfolio", panel: "v7o-prog", id: c }, null, c === "PRG-1090" ? "overview" : null);
    [["SSP", "System security plan", "Revision 3 · draft · 560 controls", "ssp", "SSP editor"], ["CP", "Contingency plan", "CP-2 · WS-X90", "plan-cp", "Plan"], ["IRP", "Incident response plan", "IR-8 · WS-X90", "plan-irp", "Plan"], ["CMP", "Configuration management plan", "CM-9 · WS-X90", "plan-cmp", "Plan"]]
      .forEach(([c, n, s, r, to]) => add("plan", c, n, s, to, () => ({ go: pick(r, "ssps") }), null, r));
    IDX = it; return it;
  }
  const RECENT = [];
  const addRecent = (k) => { const i = RECENT.indexOf(k); if (i >= 0) RECENT.splice(i, 1); RECENT.unshift(k); RECENT.length = Math.min(RECENT.length, 8); };
  window.addEventListener("hashchange", () => { const r = route(); if (r) addRecent("route:" + r); kClose(false); });
  const fromRoute = (r) => kIndex().find((x) => x.r === r);
  const hiText = (s, toks) => {
    let out = esc(s);
    for (const t of toks) { if (!t) continue; const re = new RegExp(`(${esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"); out = out.replace(/(<[^>]*>)|([^<]+)/g, (m, tagm, text) => (tagm ? tagm : text.replace(re, '<mark class="v8w-k-m">$1</mark>'))); }
    return out;
  };
  const score = (x, q, qn, toks) => {
    if (!toks.every((t) => x.hay.includes(t))) return 0;
    const c = x.code.toLowerCase(), cn = c.replace(/[^a-z0-9]/g, ""), n = x.name.toLowerCase();
    let s = 1;
    if (c && (c === q || (qn && cn === qn))) s += 1000; else if (c && (c.startsWith(q) || (qn && cn.startsWith(qn)))) s += 700 - Math.min(c.length, 60);
    if (n === q) s += 900; else if (n.startsWith(q)) s += 600; else if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(n)) s += 350; else if (n.includes(q)) s += 200;
    if (x.t === "page" || x.t === "cmd") s += 40;
    return s;
  };
  let KP = null, kOpener = null, kItems = [], kActive = 0, kInert = [];
  const ICON_S = `<svg class="v8w-k-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM14 14l-3.5-3.5"/></svg>`;
  function kEnsure() {
    if (KP) return KP;
    KP = document.createElement("div"); KP.className = "v8w-k"; KP.hidden = true;
    KP.innerHTML = `<div class="v8w-k-dlg" role="dialog" aria-modal="true" aria-label="Search">
      <div class="v8w-k-in">${ICON_S}<input type="text" id="v8w-k-q" role="combobox" aria-expanded="true" aria-controls="v8w-k-list" aria-autocomplete="list" aria-label="Search" placeholder="Search controls, risks, evidence, people, pages and commands" autocomplete="off" spellcheck="false"><span class="kbd">Esc</span><button type="button" class="v8w-k-x">Cancel</button></div>
      <div class="v8w-k-list" id="v8w-k-list" role="listbox" aria-label="Results"></div>
      <div class="v8w-k-foot"><span><span class="kbd">↑</span><span class="kbd">↓</span> Move</span><span><span class="kbd">↵</span> Open</span><span><span class="kbd">Esc</span> Close</span><span class="v8w-k-n" role="status" aria-live="polite"></span></div></div>`;
    (document.getElementById("proto") || document.body).appendChild(KP);
    const q = KP.querySelector("#v8w-k-q"), list = KP.querySelector(".v8w-k-list");
    q.addEventListener("input", () => { kActive = 0; kRender(); });
    KP.addEventListener("mousedown", (e) => { if (e.target === KP) { e.preventDefault(); kClose(true); } });
    KP.querySelector(".v8w-k-x").addEventListener("click", () => kClose(true));
    list.addEventListener("mousedown", (e) => e.preventDefault());
    list.addEventListener("mousemove", (e) => { const o = e.target.closest("[data-v8w-k]"); if (o && +o.dataset.v8wK !== kActive) kSet(+o.dataset.v8wK, false); });
    list.addEventListener("click", (e) => { const o = e.target.closest("[data-v8w-k]"); if (o) kOpen(kItems[+o.dataset.v8wK]); });
    KP.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (kItems.length) kSet((kActive + (e.key === "ArrowDown" ? 1 : kItems.length - 1)) % kItems.length, true); }
      else if (e.key === "PageDown" || e.key === "PageUp") { e.preventDefault(); if (kItems.length) kSet(Math.max(0, Math.min(kItems.length - 1, kActive + (e.key === "PageDown" ? 6 : -6))), true); }
      else if (e.key === "Enter") { e.preventDefault(); if (kItems[kActive]) kOpen(kItems[kActive]); }
      else if (e.key === "Escape") { e.preventDefault(); kClose(true); }
      else if (e.key === "Tab") { e.preventDefault(); if (document.activeElement === q && e.shiftKey === false && getComputedStyle(KP.querySelector(".v8w-k-x")).display !== "none") KP.querySelector(".v8w-k-x").focus(); else q.focus(); }
    });
    return KP;
  }
  function kSet(i, scroll) {
    kActive = i;
    KP.querySelectorAll("[data-v8w-k]").forEach((o) => { const on = +o.dataset.v8wK === i; o.classList.toggle("on", on); o.setAttribute("aria-selected", String(on)); if (on && scroll) o.scrollIntoView({ block: "nearest" }); });
    const q = KP.querySelector("#v8w-k-q"); q.setAttribute("aria-activedescendant", kItems[i] ? "v8w-k-o" + i : "");
  }
  function kRow(x, i, toks) {
    const glyph = x.glyph || h.icon(NAVICON[x.t] || "home");
    const name = x.code && x.t !== "page" ? `<b class="v8w-k-c">${hiText(x.code, toks)}</b> ${hiText(x.name, toks)}` : hiText(x.name, toks);
    return `<div class="v8w-k-o${x.t === "more" ? " more" : ""}" role="option" id="v8w-k-o${i}" aria-selected="false" data-v8w-k="${i}"><span class="v8w-k-g" aria-hidden="true">${glyph}</span><span class="v8w-k-t">${name}</span><span class="v8w-k-s">${hiText(x.sub, toks)}</span><span class="v8w-k-to">${esc(x.to)}<span aria-hidden="true"> ›</span></span></div>`;
  }
  function kRender() {
    const q0 = KP.querySelector("#v8w-k-q").value.trim().toLowerCase(), list = KP.querySelector(".v8w-k-list");
    const all = kIndex(); kItems = []; let html = "", total = 0;
    const group = (label, items, count, more) => {
      if (!items.length) return;
      html += `<div class="v8w-k-gh" role="presentation"><span>${esc(label)}</span><span class="num">${fmt(count)}</span></div>`;
      for (const x of items) { html += kRow(x, kItems.length, toks); kItems.push(x); }
      if (more) { html += kRow(more, kItems.length, []); kItems.push(more); }
    };
    const toks = q0 ? q0.split(/\s+/).filter(Boolean) : [];
    if (!q0) {
      const seen = new Set(), rec = [];
      for (const k of RECENT) { const x = k.startsWith("route:") ? fromRoute(k.slice(6)) : all.find((y) => y.key === k); if (x && !seen.has(x.key)) { seen.add(x.key); rec.push(x); } if (rec.length === 6) break; }
      if (!rec.length) { const x = fromRoute(route()); if (x) rec.push(x); }
      group("Recent", rec, rec.length);
      group("Suggested commands", all.filter((x) => x.t === "cmd"), CMDS.length);
      total = kItems.length;
    } else {
      const qn = q0.replace(/[^a-z0-9]/g, ""), groups = [];
      for (const [t, label, reg, regL] of KG) {
        const hits = all.filter((x) => x.t === t).map((x) => [score(x, q0, qn, toks), x]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]);
        if (hits.length) groups.push({ t, label, reg, regL, hits, best: hits[0][0] });
      }
      groups.sort((a, b) => b.best - a.best);
      for (const g of groups) {
        total += g.hits.length;
        const more = g.hits.length > 6 && g.reg ? { t: "more", name: `${fmt(g.hits.length - 6)} more in ${g.regL}`, sub: "", to: g.regL, act: { go: g.reg }, glyph: AK.i("down"), key: "more:" + g.t } : null;
        group(g.label, (g.t === "cmd" ? g.hits : g.hits.slice(0, 6)).map(([, x]) => x), g.hits.length, more);
      }
      if (!groups.length) html = `<div class="v8w-k-none"><b>No results for “${esc(q0)}”</b><span>Try a control code (AC-2), an element (LRU-013), a person or a page.</span></div>`;
    }
    list.innerHTML = html;
    KP.querySelector(".v8w-k-n").textContent = q0 ? `${fmt(total)} result${total === 1 ? "" : "s"}` : "";
    kSet(Math.min(kActive, Math.max(0, kItems.length - 1)), true);
  }
  function kShow(from) {
    kEnsure();
    if (!KP.hidden) { KP.querySelector("#v8w-k-q").focus(); return; }
    kOpener = from && from !== document.body ? from : null;
    const proto = KP.parentNode; kInert = [...proto.children].filter((el) => el !== KP && !el.inert); kInert.forEach((el) => { el.inert = true; });
    KP.hidden = false;
    const q = KP.querySelector("#v8w-k-q"); q.value = ""; kActive = 0; kRender(); q.focus();
    const sb = document.querySelector("#proto .top .v8w-sb"); if (sb) sb.setAttribute("aria-expanded", "true");
  }
  function kClose(back) {
    if (!KP || KP.hidden) return;
    KP.hidden = true; kInert.forEach((el) => { el.inert = false; }); kInert = [];
    const sb = document.querySelector("#proto .top .v8w-sb"); if (sb) sb.setAttribute("aria-expanded", "false");
    if (back && kOpener && document.contains(kOpener)) kOpener.focus();
    kOpener = null;
  }
  function kOpen(x) {
    if (!x) return;
    kClose(false);
    if (x.t !== "more") addRecent(x.key);
    doOpen(typeof x.act === "function" ? x.act() : x.act);
  }
  // The top bar's search box becomes the button that opens it; ⌘K or Ctrl+K opens it anywhere, the SSP editor included.
  const sb = document.querySelector("#proto .top .search");
  if (sb) {
    sb.classList.add("v8w-sb"); sb.setAttribute("role", "button"); sb.tabIndex = 0; sb.setAttribute("aria-label", "Search"); sb.setAttribute("aria-haspopup", "dialog"); sb.setAttribute("aria-expanded", "false"); sb.setAttribute("aria-keyshortcuts", "Meta+K Control+K");
    const t = [...sb.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
    if (t) { const s = document.createElement("span"); s.className = "v8w-sb-t"; s.textContent = t.textContent.trim(); sb.replaceChild(s, t); }
    sb.insertAdjacentHTML("afterbegin", ICON_S);
    sb.addEventListener("click", () => kShow(sb));
    sb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); kShow(sb); } });
  }
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key === "k" || e.key === "K")) {
      e.preventDefault(); e.stopPropagation();
      if (KP && !KP.hidden) kClose(true); else kShow(document.activeElement);
    }
  }, true);
  PA.search = { open: () => kShow(document.activeElement), close: () => kClose(true) };

  // ═════════════ 2. Tickets on records: Jira (connected, WSX project, two-way) and ServiceNow (available, not connected) ═════════════
  // A record (check:<id>, poam:<id>, issue:<id>) lists its tickets; a ticket's status syncs both ways, and the record says when the tool moved it.
  const TOOL = { jira: ["JI", "Jira"], snow: ["SN", "ServiceNow"] };
  const TKST = { "To do": "none", "In progress": "warn", "In review": "info", Done: "ok", Blocked: "bad", "Not sent": "none" };
  const tk = (key, sum, st, ago, who, note, type = "Task", tool = "jira") => ({ key, sum, st, ago, who, note, type, tool });
  const TK = {
    "check:scan": [tk("WSX-412", "Run the November mission network scan (RA-5)", "In progress", "4 min ago", "Joel Barrantes", "In progress in Jira since Nov 4 → the check reads the scan as in progress")],
    "check:iava": [tk("WSX-405", "Patch IAVA 2026-A-0117, OpenSSH on the Mission Computer image", "In review", "9 min ago", "Marcus Ryde", null, "Bug"), tk("WSX-411", "Patch IAVA 2026-A-0124, Linux kernel 6.6", "To do", "9 min ago", null, null, "Bug")],
    "check:stig": [tk("WSX-399", "CAT I · Maintenance Laptop: SSH permits password authentication", "In progress", "12 min ago", "Joel Barrantes", null, "Bug"), tk("WSX-400", "CAT I · Provisioning Workstation: USB mass storage not disabled", "To do", "12 min ago", null, null, "Bug")],
    "check:sbom": [tk("WSX-409", "Take Mission Computer version 2 (openssh-server 9.8p1) for CVE-2024-6387", "In progress", "4 min ago", ME)],
    "poam:03c0317f": [tk("WSX-386", "Milestone 1 · Publish the retired signing key identifiers from LRU-003", "Done", "2 min ago", "Priya Raghavan", "Done in Jira on Oct 8 → milestone 1 completed Oct 8"),
      tk("WSX-387", "Milestone 2 · Re-verify the stranded arm and release records", "In progress", "2 min ago", "Priya Raghavan", null), tk("WSX-388", "Milestone 3 · Reissue the audit procedures", "To do", "2 min ago", null, null)],
    "poam:def9d690": [tk("WSX-408", "Milestone 1 · Set LoginGraceTime 0 on the maintenance interface", "In review", "4 min ago", ME, "In review in Jira → milestone 1 stays planned until it is Done"), tk("WSX-409", "Milestone 2 · Take Mission Computer version 2", "In progress", "4 min ago", ME)],
    "issue:1f680dd7": [tk("WSX-385", "Arm and release commands signed under a rotated key can't be verified (AU-10)", "In progress", "2 min ago", "Priya Raghavan", "Its POA&M item's milestones sync as WSX-386 to WSX-388", "Bug")],
    "issue:a4823e25": [tk("WSX-416", "Remove the password-only logon from the Maintenance Laptop (IA-2(2))", "To do", "6 min ago", "Joel Barrantes", null, "Bug")],
    "issue:c0fdce4e": [tk("WSX-409", "Take Mission Computer version 2 (openssh-server 9.8p1) for CVE-2024-6387", "In progress", "4 min ago", ME)],
  };
  let tkNext = 419;
  const recTitle = (rec) => {
    const [t, id] = rec.split(":");
    if (t === "check") return CHECKS[id] || "Check";
    if (t === "poam") return (POAM.find((x) => x.id === id) || {}).t || "POA&M item";
    if (t === "issue") return (ISS.find((x) => x.id === id) || {}).t || "Operational issue";
    return "Record";
  };
  const tkRow = (x) => `<div class="v8w-tk-r" tabindex="-1" data-v8w-tkey="${esc(x.key)}">
      <span class="v8w-tool ${x.tool}" title="${esc(TOOL[x.tool][1])}" aria-label="${esc(TOOL[x.tool][1])}">${TOOL[x.tool][0]}</span>
      <span class="v8w-tk-x"><span class="v8w-tk-k">${esc(x.key)}</span><span class="v8w-tk-s" title="${esc(x.sum)}">${esc(x.sum)}</span></span>
      <span class="v8w-tk-st">${pill(TKST[x.st] || "none", x.st)}<span class="v8w-mu">${x.tool === "snow" && x.st === "Not sent" ? "ServiceNow isn't connected" : `synced ${esc(x.ago)}`}</span></span>
      <span class="v8w-tk-m">${AK.owner(x.who)}<span class="v8w-tk-type">${esc(x.type)}</span><span class="ak-link v8w-tk-open" title="Opens ${esc(x.key)} in ${esc(TOOL[x.tool][1])} (prototype: inert)">Open in ${esc(TOOL[x.tool][1])} ${AK.i("link")}</span></span>
      ${x.note ? `<span class="v8w-tk-n">${AK.i("history")}${esc(x.note)}</span>` : ""}</div>`;
  function tkSection(rec) {
    const list = TK[rec] || [];
    const body = list.length ? `<div class="v8w-tk-list">${list.map(tkRow).join("")}</div>`
      : `<p class="v8w-tk-none">No tickets yet. A ticket made here carries the record's summary, and its status comes back on its own.</p>`;
    return `<section class="ak-sec v8w-tk" data-v8w-tk="${esc(rec)}"><div class="ak-sec-h"><h3>Tickets<span class="ct num">${list.length}</span></h3>${btn(`${AK.i("plus")}Create ticket`, `data-modal="v8w-ticket-new" data-id="${esc(rec)}"`)}</div>
      ${body}
      <div class="v8w-tk-sync">${AK.i("link")}<span>Jira · WSX project · status, assignee and comments sync both ways · POA&amp;M milestones ↔ issues</span>${lk("Manage", pick("integration-jira", "integrations"))}</div>
      ${AK.note("Tickets are invented: Jira is connected to a WSX project in this prototype only.")}</section>`;
  }
  M["v8w-ticket-new"] = (rec) => {
    const r = String(rec || "check:scan"), kind = r.split(":")[0], title = recTitle(r);
    const sum = kind === "poam" ? `${title}: remediation` : kind === "check" ? `Failing check: ${title}` : title;
    return { title: "Create ticket", body: `
      <p class="ak-desc">For <b>${esc(title)}</b>. The ticket links back to this record; what you choose to sync moves both ways.</p>
      ${field("Tool", `<div class="v8w-opts">${radio("tool", "jira", `Jira ${pill("ok", "Connected")}`, true, "WSX project · two-way")}${radio("tool", "snow", `ServiceNow ${pill("none", "Not connected")}`, false, "Saved here and sent once an admin connects it")}</div>`)}
      <div class="v8w-two">${field("Project", select("project", ["WSX · WS-X90 Sentinel", "WSXOPS · WS-X90 operations"], "WSX · WS-X90 Sentinel", "Project"))}${field("Issue type", select("type", ["Task", "Bug", "Story", "Sub-task"], kind === "issue" ? "Bug" : "Task", "Issue type"))}</div>
      ${field("Summary", input("summary", sum, "Summary"), REQ, "Prefilled from the record")}
      ${field("What syncs", `<div class="v8w-opts">${check("s-status", "Status, both ways", true, "Done in Jira completes the record's step; a change here moves the issue")}${check("s-assignee", "Assignee", true, "The record's owner and the issue's assignee stay the same person")}${check("s-comments", "Comments", false, "Comments are copied each way, with their author")}${kind === "poam" ? check("s-ms", "POA&M milestones as sub-tasks", true, "Each milestone becomes a sub-task; Done completes the milestone") : ""}</div>`)}
      ${err("Write a summary for the ticket.")}`,
      footer: submitFoot("Create ticket", "ticket", r) };
  };
  const tkCreate = (rec, dlg) => {
    const v = (n) => { const el = dlg.querySelector(`[name="${n}"]`); return el ? (el.type === "checkbox" || el.type === "radio" ? el.checked : el.value) : null; };
    const sum = String(v("summary") || "").trim();
    if (!sum) return false;
    const tool = dlg.querySelector('[name="tool"]:checked') ? dlg.querySelector('[name="tool"]:checked').value : "jira";
    const key = tool === "jira" ? `WSX-${tkNext++}` : `SN draft ${(TK[rec] || []).filter((x) => x.tool === "snow").length + 1}`;
    const x = tk(key, sum, tool === "jira" ? "To do" : "Not sent", "just now", rec.startsWith("poam:def9d690") || rec === "check:sbom" ? ME : null, tool === "jira" && v("s-ms") ? "Its milestones are sub-tasks: Done in Jira completes the milestone" : null, v("type") || "Task", tool);
    (TK[rec] = TK[rec] || []).unshift(x);
    setTimeout(() => {
      document.querySelectorAll(`[data-v8w-tk="${CSS.escape(rec)}"]`).forEach((el) => { el.outerHTML = tkSection(rec); });
      const row = document.querySelector(`[data-v8w-tk="${CSS.escape(rec)}"] [data-v8w-tkey="${CSS.escape(key)}"]`); if (row) row.focus();
    }, 30);
    toast(tool === "jira" ? `${key} created in Jira · status syncs both ways` : "Ticket saved: it goes to ServiceNow once an admin connects it", tool === "jira" ? null : "Open integrations", pick("integration-snow", "integrations"));
    return true;
  };
  // Where the section goes: the check record (Results and Tasks), a POA&M item's Overview, an operational issue's panel.
  PA.decorate(/^check-(scan|iava|stig|sbom|expiring|poam-review|priv-review)(-tasks)?$/, (html, r) => {
    const m = r.match(/^check-(.+?)(-tasks)?$/), rec = "check:" + m[1];
    if (html.includes(`data-v8w-tk="${rec}"`)) return html;
    if (!m[2]) { const i = html.indexOf('</div><aside class="ak-rail">'); return i < 0 ? html : html.slice(0, i) + tkSection(rec) + html.slice(i); }
    return html.replace(/<\/div>\s*$/, `${tkSection(rec)}</div>`);
  });
  PA.decoratePanel("a-risk-poam", (html, id) => {
    const [pid, tab] = String(id || "").split("|");
    if ((tab && tab !== "overview") || !/^<div class="a-risk-pan"/.test(html) || html.includes("data-v8w-tk=")) return html;
    const at = html.indexOf('<div class="ak-card"><div class="a-risk-ch"><b>Answers</b>');
    return at > 0 ? html.slice(0, at) + tkSection("poam:" + pid) + html.slice(at) : html.replace(/<\/div>\s*$/, `${tkSection("poam:" + pid)}</div>`);
  });
  PA.decoratePanel("a-risk-issue", (html, id) => {
    const [iid, tab] = String(id || "").split("|");
    if ((tab && tab !== "overview") || !/^<div class="a-risk-pan"/.test(html) || html.includes("data-v8w-tk=")) return html;
    return html.replace(/<\/div>\s*$/, `${tkSection("issue:" + iid)}</div>`);
  });
  // My work: a task that has a ticket says so on its row.
  const MWT = [["Remediate CVE-2024-6387 on the Mission Computer", "WSX-409", "In progress"], ["Run the quarterly configuration baseline audit (CM-2, CM-3)", "WSX-397", "To do"]];
  PA.decorate(/^my-work(-mine)?$/, (html) => {
    for (const [t, key, st] of MWT) {
      const mark = `<b>${esc(t)}</b>`, i = html.indexOf(mark);
      if (i < 0 || html.slice(i, i + 400).includes("v8w-tkchip")) continue;
      const j = i + mark.length;
      html = html.slice(0, j) + `<span class="v8w-tkchip" title="Jira ${esc(key)} · ${esc(st)} · synced both ways (Example)"><span class="v8w-tool jira" aria-hidden="true">JI</span>${esc(key)} · ${esc(st)}</span>` + html.slice(j);
    }
    return html;
  });

  // ═════════════ 3. AI agents (ai-drafts): Needs approval · Runs · Agents ═════════════
  // Kept from the AI drafts screen: SSP 3's 74 placeholder narratives and 14 controls with no requirement (real, PA.SSP), its three
  // draft runs and the templates. The agents, the waiting runs and their items are invented.
  const PH = SSP.lists.placeholders, PH_AC = PH.filter((c) => c.startsWith("AC-")), NOREQ = SSP.lists.noRequirement;
  const AGENTS = [
    { id: "narr", n: "Narrative drafter", does: "Drafts a control's implementation narrative from its requirements, evidence and parameters", reads: ["Controls and their parameters", "Requirements and their allocations", "Accepted evidence"], writes: "Suggested narratives in the SSP editor", trig: ["Manual", `When a control's evidence is accepted`], owner: ME, last: "Today 9:12", on: true },
    { id: "req", n: "Requirement drafter", does: "Drafts a requirement for each control of the baseline no requirement maps", reads: ["The control baseline", "Control objectives", "Requirements"], writes: "Suggested requirements, as drafts", trig: ["Manual"], owner: "Priya Raghavan", last: "Nov 16", on: true },
    { id: "evmap", n: "Evidence mapper", does: "Proposes links from new evidence to the requirements and controls it supports", reads: ["Evidence artifacts and versions", "Requirements", "Control objectives"], writes: "Suggested evidence links", trig: ["When evidence is uploaded"], owner: "Priya Raghavan", last: "Today 8:40", on: true },
    { id: "poam", n: "POA&M milestone writer", does: "Proposes milestones and planned dates inside each item's remediation deadline", reads: ["Operational issues", "POA&M items", "Remediation deadlines"], writes: "Suggested milestones", trig: ["When a POA&M item is created", "Every Monday"], owner: "Joel Barrantes", last: "Yesterday", on: true },
    { id: "stig", n: "STIG triage", does: "Matches open STIG rules to POA&M items that already answer them", reads: ["STIG checklists (.ckl, .cklb)", "POA&M items", "Operational issues"], writes: "Suggested matches", trig: ["When a STIG checklist is imported"], owner: "Joel Barrantes", last: "Today 7:55", on: true },
    { id: "itcsc", n: "ITCSC reader", does: "Reads an uploaded ITCSC into the fields of WS-X90's boundary", reads: ["Uploaded ITCSC checklists", "The system record"], writes: "Suggested field values in the ITCSC import", trig: ["When an ITCSC is uploaded"], owner: ME, last: "Today 10:05", on: true },
    { id: "qa", n: "Questionnaire answerer", does: "Answers a data call's questions from the SSP, policies and evidence, citing each source", reads: ["SSP 3", "Policies", "Accepted evidence", "Data call knowledge base"], writes: "Suggested answers in a data call", trig: ["Manual"], owner: "Priya Raghavan", last: "Nov 16", on: true },
    { id: "chg", n: "Change summarizer", does: "Writes the change log entry for each published SSP revision", reads: ["SSP revisions and their changes"], writes: "A suggested change log entry", trig: ["When an SSP revision is published"], owner: "Joel Barrantes", last: "Jul 25", on: false },
  ];
  const AG = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
  const TEMPLATE = "The SYS-WSX90 satisfies the tailored intent of {c} through a combination of system-level procedures and mapped component implementations. This narrative is synthetic demo content.";
  const NARR = { "AC-2": "Accounts on WS-X90 exist only through the account service on the Platform Management Controller (LRU-013); every create, modify, enable, disable and remove action is logged and exported to the Security Log Collector (LRU-018).",
    "AC-3": "The Platform Management Controller enforces role-based access on every maintenance and mission service; a request outside the caller's role is refused and logged.",
    "AC-11": "The Protected Network Gateway, Platform Management Controller and Maintenance Access Gateway lock a session after the inactivity period AC-11_ODP[02] sets; that period is not set yet.",
    "AC-17": "Remote maintenance reaches WS-X90 only through the Maintenance Access Gateway (LRU-014), with two factors and inside an approved work order window." };
  const narr = (c) => NARR[c] || `Drafted from ${c}'s requirements and accepted evidence: ${((ctl(c) || {}).t || c).toLowerCase()} is enforced on the elements its requirements are allocated to, as the evidence records.`;
  const EVS = EVID.filter((e) => /^[me]/.test(e.id)).slice(0, 6);
  const ST_RUN = { waiting: ["warn", "Waiting on you"], approved: ["ok", "Approved"], partly: ["part", "Partly approved"], rejected: ["bad", "Rejected"] };
  // Runs: what each proposes and where it lands. items: [label, text, source]
  const RUNS = [
    { id: "w1", ag: "narr", by: ME, when: "Today 9:12", dur: "3 min", what: `${PH_AC.length} implementation narratives for AC in SSP 3`, unit: "narratives", lands: ["SSP 3 · suggestions in the SSP editor", pick("ssp")],
      items: PH_AC.map((c) => [c, narr(c), `${c} · ${((ctl(c) || {}).r || 0)} requirements · replaces placeholder text`]) },
    { id: "w2", ag: "evmap", by: "Priya Raghavan", when: "Today 8:40", dur: "48 s", what: "Link 6 artifacts to 11 controls", unit: "links", lands: ["Evidence · proposed links", "evidence"],
      items: [["AU-8", EVS[0].t, "Time source comparison → AU-8, AU-8(1)"], ["AU-8(1)", EVS[0].t, "Same artifact"], ["MA-4", EVS[1].t, "Session teardown → MA-4, AC-12"], ["AC-12", EVS[1].t, "Same artifact"], ["CM-14", EVS[2].t, "Pinned toolchain → CM-14, SA-10"], ["SA-10", EVS[2].t, "Same artifact"], ["SC-7(5)", EVS[3].t, "Connection register → SC-7(5)"], ["AC-4", EVS[3].t, "Same artifact"], ["CM-12", EVS[4].t, "Location map → CM-12"], ["MP-6", EVS[5].t, "Destruction certificates → MP-6, MP-6(1)"], ["MP-6(1)", EVS[5].t, "Same artifact"]] },
    { id: "w3", ag: "poam", by: "Joel Barrantes", when: "Today 8:02", dur: "1 min", what: "Milestones for 3 POA&M items", unit: "milestones", lands: ["POA&M · 3 items", "poam"],
      items: POAM.filter((x) => ["0344afc0", "ccb452ad", "96e50cb7"].includes(x.id)).flatMap((x) => [[x.t, "Correct the implementation on its elements · planned Dec 4", "Remediation deadline Dec 18"], [x.t, "Collect replacement evidence · planned Dec 11", "Reviewer: Priya Raghavan"], [x.t, "Reassess the requirement · planned Dec 18", "Assessor: Nadia Fournier"]]) },
    { id: "w4", ag: "stig", by: "Joel Barrantes", when: "Today 7:55", dur: "2 min", what: "23 CAT II open rules matched to existing POA&M items", unit: "matches", lands: ["STIG checklist · Maintenance Laptop", pick("stigs", "check-stig")],
      items: [["V-230264", "RHEL 8 must prevent the installation of software not signed by a trusted key", "→ Remediate REQ-186 · pinned toolchain"], ["V-230265", "RHEL 8 must verify the signatures of local packages before install", "→ Remediate REQ-186"], ["V-230300", "RHEL 8 must disable mounting of removable media with execute permission", "→ Refuse unlisted hardware on every switch port"], ["V-230311", "RHEL 8 must disable kernel core dumps", "→ Remediate REQ-045"], ["V-230344", "RHEL 8 must lock an account after three failed logons", "→ Remediate REQ-039"], ["V-230380", "RHEL 8 must not allow accounts with blank passwords to log on over SSH", "→ Remediate REQ-039"], ["V-230386", "RHEL 8 must audit every use of privileged functions", "→ Alert on privileged tool use outside an open work order"]], more: 16 },
    { id: "w5", ag: "itcsc", by: ME, when: "Today 10:05", dur: "22 s", what: "37 fields read from the uploaded ITCSC", unit: "fields", lands: ["ITCSC import · WS-X90", pick("itcsc-import", "itcsc", "overview")],
      items: [["System name", SSP.system.name, "Page 1 · block 1"], ["System type", "Platform IT (PIT) · national security system", "Page 1 · block 3"], ["Confidentiality", SSP.system.cia[0], "Page 2 · categorization"], ["Integrity", SSP.system.cia[1], "Page 2 · categorization"], ["Availability", SSP.system.cia[2], "Page 2 · categorization"], ["Authorizing official", "R. Calloway", "Page 1 · block 9"], ["Interconnections", `${SSP.interconnections.length} named, ${SSP.interconnections.filter((x) => /ISA|MOA|MOU/.test(x.agreement)).length} with an agreement`, "Page 3 · table 2"]], more: 30 },
    { id: "w6", ag: "qa", by: "Priya Raghavan", when: "Today 6:30", dur: "4 min", what: "41 answers in Customer A's data call", unit: "answers", lands: ["Customer A data call · answers", pick("data-calls-cusa", "data-calls")],
      items: [["Q1.2", "WS-X90 is categorized High, High, Moderate under CNSSI 1253, as SSP 3 section 2 records.", "SSP 3 · section 2"], ["Q2.1", "Accounts are managed by the account service on LRU-013; disable within 72 hours is required by REQ-439.", "SSP 3 · AC-2(3) · REQ-439"], ["Q3.4", "Vulnerability scans run monthly on the mission network; the November scan is in progress.", "Check · RA-5's frequency"], ["Q4.1", "Incident response follows the WS-X90 incident response plan, exercised each year.", "Plans · IR-8"], ["Q5.3", "CVE-2024-6387 is fixed in Mission Computer version 2, published Nov 12.", "Component · Mission Computer"]], more: 36 },
    { id: "b2", ag: "req", by: "Priya Raghavan", when: "Nov 16", dur: "1 min", what: "3 requirements for controls no requirement maps", unit: "requirements", lands: ["Requirements · drafts", "requirements"],
      items: [["SA-24", "WS-X90 shall apply the nine cyber resiliency techniques SA-24_ODP[03] names, Adaptive Response through Substantiated Integrity, to the Mission Computing and Communications subsystems.", "SA-24_ODP[03] · program tailoring"], ["SI-4(13)", "Map REQ-262 to SI-04(13)(a)[02], (b)[02] and (c)[02]: event patterns are profiled beside the traffic it already profiles.", "REQ-262 · SI-4(13) objectives"], ["SC-34", "The Mission Computer and Secure Boot Controller shall load the operating system and applications from hardware-enforced read-only media.", "SC-34 · Secure Boot Controller"]] },
    { id: "b1", ag: "narr", by: ME, when: "Nov 16", dur: "2 min", what: "SSP 3 narratives · AC family", unit: "narratives", lands: ["SSP 3", pick("ssp")], done: "partly",
      items: [["AC-2", "Account management on WS-X90 rests on REQ-001 and REQ-075: accounts on the Mission Computer, Protected Network Gateway, Navigation & Timing Subsystem and Maintenance Laptop are created, reviewed and disabled through the provisioning workstation.", "REQ-001, REQ-075 · Evidence for REQ-001"], ["AC-2(7)", "Platform privilege is carried by named roles, never attached to an account (REQ-443). The Platform Management Controller holds the role table; membership changes are logged and exported.", "REQ-443 · LRU-013"], ["AC-11", "The Protected Network Gateway, Platform Management Controller and Maintenance Access Gateway lock a session after the inactivity period AC-11_ODP[02] sets; that period is not set yet.", "REQ-008, REQ-082 · AC-11_ODP[02] not set"]] },
    { id: "b3", ag: "narr", by: ME, when: "Nov 15", dur: "1 min", what: "SSP 3 narratives · SI family", unit: "narratives", lands: ["SSP 3", pick("ssp")], done: "partly",
      items: [["SI-2", "Flaws are identified by the monthly mission network scan and the Mission Computer SBOM. CVE-2024-6387 was fixed in Mission Computer version 2 (openssh-server 9.8p1).", "REQ-064 · Mission Computer SBOM"], ["SI-4(13)", "Outbound traffic is profiled per mission phase on the Protected Network Gateway and Tactical Data Radio (REQ-262).", "REQ-262"]] },
    { id: "h1", ag: "evmap", by: "Priya Raghavan", when: "Nov 14", dur: "36 s", what: "Link 4 artifacts to 6 controls", unit: "links", lands: ["Evidence", "evidence"], done: "approved", items: [] },
    { id: "h2", ag: "stig", by: "Joel Barrantes", when: "Nov 3", dur: "3 min", what: "October checklists · 31 rules matched", unit: "matches", lands: ["STIG checklists", pick("stigs", "check-stig")], done: "partly", items: [] },
    { id: "h3", ag: "poam", by: "Joel Barrantes", when: "Nov 2", dur: "1 min", what: "Milestones for 5 POA&M items", unit: "milestones", lands: ["POA&M", "poam"], done: "rejected", why: "The planned dates ignored the 30-day CAT II window.", items: [] },
    { id: "h4", ag: "qa", by: "Priya Raghavan", when: "Oct 30", dur: "6 min", what: "FY2026 FISMA data call · 62 answers", unit: "answers", lands: ["FY2026 data call", pick("data-calls-fy26", "data-calls")], done: "approved", items: [] },
    { id: "h5", ag: "chg", by: "Joel Barrantes", when: "Jul 25", dur: "40 s", what: "SSP 2 change log entry", unit: "entries", lands: ["SSP 2", pick("ssp-history", "ssps")], done: "approved", items: [] },
  ];
  const RUN = Object.fromEntries(RUNS.map((r) => [r.id, r]));
  const RS = {}; // run id -> waiting | approved | partly | rejected, set by a person
  const IS = { "b1-0": "approved", "b1-1": "approved", "b1-2": "rejected", "b3-0": "approved", "b3-1": "rejected" }; // run-item -> approved | rejected
  const nItems = (r) => r.items.length + (r.more || 0);
  const runState = (r) => {
    if (RS[r.id]) return RS[r.id];
    if (r.done) return r.done;
    const s = r.items.map((_, i) => IS[`${r.id}-${i}`]);
    if (!s.length || s.some((x) => !x) || r.more) return "waiting";
    return s.every((x) => x === "approved") ? "approved" : s.every((x) => x === "rejected") ? "rejected" : "partly";
  };
  const waiting = () => RUNS.filter((r) => runState(r) === "waiting");
  const AGON = Object.fromEntries(AGENTS.map((a) => [a.id, a.on]));
  const aiHead = () => AK.indexHead({ title: "AI agents", desc: `Agents read WS-X90's records and propose; a person approves every change. ${PH.length} of SSP 3's ${SSP.controls.length} narratives are placeholder text and ${NOREQ.length} controls have no requirement.`,
    actions: `${btn("Settings", `data-go="permissions"`)}${btn(`${AK.i("sparkle")}Run an agent`, 'data-modal="v8w-run-new"', true)}` });
  const aiTabs = (cur) => AK.tabs([["Needs approval", waiting().length, cur === "queue" ? null : "ai-drafts", cur === "queue"], ["Runs", RUNS.length, cur === "runs" ? null : "ai-drafts-runs", cur === "runs"], ["Agents", AGENTS.length, cur === "agents" ? null : "ai-drafts-agents", cur === "agents"]], "AI agents");
  const agGlyph = (id) => `<span class="v8w-ag" aria-hidden="true">${AK.i("sparkle")}</span>`;
  const runCard = (r) => {
    const a = AG[r.ag], n = nItems(r);
    return `<div class="v8w-qr" data-v8w-run="${r.id}">
      ${agGlyph(r.ag)}
      <div class="v8w-qx"><div class="v8w-qt"><b>${esc(a.n)}</b><span class="v8w-qsep">:</span> <span>${esc(r.what)}</span> ${EX}</div>
        <div class="v8w-qm">${AK.owner(r.by)}<span>${esc(r.when)}</span><span>${plural(n, r.unit.replace(/s$/, ""), r.unit)} waiting</span><span class="v8w-ql">${AK.i("link")}Lands in ${lk(esc(r.lands[0]), r.lands[1])}</span></div></div>
      <div class="btns v8w-qb">${btn("Reject…", `data-modal="v8w-reject" data-id="${r.id}"`)}${btn("Review items", `data-panel="v8w-run" data-id="${r.id}"`)}${btn(`${AK.i("check")}Approve all`, `data-v8w-approve-all="${r.id}"`)}</div></div>`;
  };
  S["ai-drafts"] = () => {
    const w = waiting();
    return h.page(
      aiHead(), aiTabs("queue"),
      line(`${AK.i("sparkle")}Agents only propose. A person approves each change, and no agent writes a determination, a risk acceptance or a signature.`),
      chips("aiq", [["all", "All", w.length], ["mine", "Started by me", w.filter((r) => r.by === ME).length], ["ssp", "Lands in the SSP", w.filter((r) => r.ag === "narr").length]]),
      w.length ? `<div class="v8w-q" role="list" aria-label="Runs waiting for approval">${w.filter((r) => ({ all: true, mine: r.by === ME, ssp: r.ag === "narr" })[QV.aiq || "all"]).map(runCard).join("")}</div>`
        : AK.empty({ title: "Nothing waits on you", line: "New runs land here when an agent finishes." }),
      AK.note("The agents, their runs and their proposals are invented: WS-X90 holds no AI runs. The 74 placeholder narratives, the 14 controls with no requirement, the controls, evidence and POA&M items they name are WS-X90's."),
    );
  };
  S["ai-drafts-runs"] = () => {
    const f = QV.air || "all", rows = RUNS.filter((r) => f === "all" || runState(r) === f);
    return h.page(
      aiHead(), aiTabs("runs"),
      chips("air", [["all", "All", RUNS.length], ["waiting", "Waiting", RUNS.filter((r) => runState(r) === "waiting").length], ["approved", "Approved", RUNS.filter((r) => runState(r) === "approved").length], ["partly", "Partly approved", RUNS.filter((r) => runState(r) === "partly").length], ["rejected", "Rejected", RUNS.filter((r) => runState(r) === "rejected").length]]),
      filters("Search runs", ["Agent", "Started by", "Record"]),
      tbl({ cols: ["Run", "Agent", "Started by", "Started", "Duration", "Items", "Outcome", "Record"], label: "Agent runs", panel: "v8w-run",
        rows: rows.map((r) => ({ id: r.id, cells: [tr(r.what, 200), tr(AG[r.ag].n, 130), AK.owner(r.by), `<span class="num">${esc(r.when)}</span>`, `<span class="num">${esc(r.dur)}</span>`, num(nItems(r)), pill(ST_RUN[runState(r)][0], ST_RUN[runState(r)][1]), `<span class="v8w-tr" style="max-width:120px">${lk(esc(r.lands[0].split(" · ")[0]), r.lands[1])}</span>`] })), total: rows.length }),
      AK.note("Every run is invented. An approved item becomes an edit under the approver's name; a rejected one keeps its reason."),
    );
  };
  S["ai-drafts-agents"] = () => h.page(
    aiHead(), aiTabs("agents"),
    filters("Search agents", ["Trigger", "Owner", "Status"]),
    tbl({ cols: ["Agent", "Reads", "May write (suggestions)", "Trigger", "Owner", "Last run", "On"], label: "Agents", panel: "v8w-agent",
      rows: AGENTS.map((a) => ({ id: a.id, cells: [`<span class="v8w-agn">${agGlyph(a.id)}<span><b>${esc(a.n)}</b><small>${esc(a.does)}</small></span></span>`, tr(a.reads.join(", "), 150), `<span class="v8w-tr" style="max-width:150px" title="${esc(a.writes)}">${esc(cap(a.writes.replace(/^Suggested |^A suggested /, "")))}</span>`, [...new Set(a.trig.map((t) => (t.startsWith("When") ? "Event" : t.startsWith("Every") ? "Schedule" : t)))].map(tag).join(" "), AK.owner(a.owner), `<span class="num">${esc(a.last)}</span>`, sw(AGON[a.id], `${a.n} on`, "agent:" + a.id)] })), total: AGENTS.length, pager: false }),
    sec("Templates", `<div class="v8w-tpl">${SSP.templates.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
      <p class="v8w-p">The Narrative drafter starts from these SSP section templates. It replaces the placeholder text ${num(PH.length)} narratives still carry, ${num(SSP.lists.placeholdersSatisfied.length)} of them on controls the assessor found satisfied:</p>
      <blockquote class="v8w-quote">${esc(TEMPLATE)}</blockquote>`, { count: SSP.templates.length }),
    AK.note("The eight agents are invented. The templates and the placeholder text are SSP 3's."),
  );
  P["v8w-run"] = (id) => {
    const r = RUN[id] || RUNS[0], a = AG[r.ag], st = runState(r), wait = st === "waiting";
    const items = r.items.map(([lab, text, src], i) => {
      const s = IS[`${r.id}-${i}`];
      return `<div class="ak-card v8w-item"><div class="v8w-item-h"><b>${esc(lab)}</b>${s ? pill(s === "approved" ? "ok" : "bad", cap(s)) : pill("warn", "Waiting")}<span class="v8w-push">${!wait ? "" : s ? btn("Undo", `data-v8w-item="${r.id}|${i}|" aria-label="Undo ${esc(lab)}"`) : `${btn("Reject", `data-v8w-item="${r.id}|${i}|rejected" aria-label="Reject ${esc(lab)}"`)}${btn("Approve", `data-v8w-item="${r.id}|${i}|approved" aria-label="Approve ${esc(lab)}"`)}`}</span></div>
        <p class="v8w-item-t">${esc(text)}</p><div class="v8w-item-s">${AK.i("link")}${esc(src)}</div></div>`;
    }).join("");
    const left = r.items.filter((_, i) => !IS[`${r.id}-${i}`]).length + (r.more || 0);
    return { label: "Agent run preview", body: `<div class="v8w-pan">${AK.recordHead({ title: `${a.n}: ${r.what}`, chip: pill(ST_RUN[st][0], ST_RUN[st][1]),
      actions: wait ? btn(`Approve ${left === nItems(r) ? "all" : "the rest"}`, `data-v8w-approve-all="${r.id}"`, true) : "" })}
      ${AK.facts([["Started by", AK.owner(r.by)], ["Started", esc(r.when)], ["Duration", esc(r.dur)], ["Items", `<span class="num">${nItems(r)} ${esc(r.unit)}</span>`]])}
      <div class="v8w-lands">${AK.i("link")}<span>Lands in <b>${esc(r.lands[0])}</b>, where each item shows as a suggestion until it is approved.</span>${btn("Open in place", `data-go="${esc(r.lands[1])}"`)}</div>
      ${r.why ? AK.reasonCard({ question: "Why it was rejected", reason: r.why, who: r.by, when: r.when }) : ""}
      ${items ? sec("Items", items + (r.more ? `<p class="v8w-p">${num(r.more)} more ${esc(r.unit)} wait in ${esc(r.lands[0].split(" · ")[0])}. ${wait ? "Approve the rest approves them too." : ""}</p>` : ""), { count: nItems(r) }) : `<p class="v8w-p">${esc(cap(st === "rejected" ? "rejected" : "reviewed"))}: its items now read as edits in ${esc(r.lands[0])}.</p>`}
      ${wait ? `<div class="btns">${btn("Reject the run…", `data-modal="v8w-reject" data-id="${r.id}"`)}</div>` : ""}
      ${AK.note("This run and its items are invented.")}</div>` };
  };
  P["v8w-agent"] = (id) => {
    const a = AG[id] || AGENTS[0], runs = RUNS.filter((r) => r.ag === a.id);
    return { label: "Agent preview", body: `<div class="v8w-pan">${AK.recordHead({ title: a.n, chip: AGON[a.id] ? pill("ok", "On") : pill("none", "Off"), actions: btn(`${AK.i("sparkle")}Run now`, `data-modal="v8w-run-new" data-id="${a.id}"`, true) })}
      <p class="ak-desc">${esc(a.does)}.</p>
      ${AK.facts([["Owner", AK.owner(a.owner)], ["Trigger", a.trig.map(esc).join(" · ")], ["Last run", esc(a.last)], ["Runs", num(runs.length)]])}
      ${sec("Permissions", `<div class="v8w-perm">${[["Reads", a.reads, "eye", "ok"], ["May write", [a.writes + ", each waiting for a person"], "pen", "warn"], ["Never writes", ["A determination", "A risk acceptance", "A signature or an authorization decision"], "ban", "bad"]].map(([k, list, ic, tone]) => `<div class="v8w-perm-r"><span class="v8w-perm-k ${tone}">${AK.i(ic)}${esc(k)}</span><span>${list.map(esc).join("<br>")}</span></div>`).join("")}</div>`)}
      ${sec("Recent runs", runs.length ? runs.map((r) => li(pill(ST_RUN[runState(r)][0], ST_RUN[runState(r)][1]), `<span class="v8w-a" data-panel="v8w-run" data-id="${r.id}" role="link" tabindex="0">${esc(r.what)}</span>`, `<span class="num">${esc(r.when)}</span>`)).join("") : `<p class="v8w-p">No runs yet.</p>`, { count: runs.length })}
      ${AK.note("The agent and its runs are invented.")}</div>` };
  };
  M["v8w-reject"] = (id) => {
    const r = RUN[id] || RUNS[0];
    return { title: "Reject the run", body: `<p class="ak-desc">${esc(AG[r.ag].n)}: ${esc(r.what)}. Nothing it proposed is applied; the reason stays on the run.</p>
      ${field("Reason", area("reason", "", "Reason", "What was wrong? The agent's owner reads it, and it shapes the next run."), REQ)}${err("Say why you reject it: the reason is required.")}`,
      footer: submitFoot("Reject run", "reject", id) };
  };
  M["v8w-run-new"] = (id) => {
    const a = AG[id] || AG.narr;
    return { title: "Run an agent", body: `<p class="ak-desc">What it proposes waits in Needs approval. Nothing is applied until a person approves it.</p>
      ${field("Agent", select("agent", AGENTS.filter((x) => AGON[x.id]).map((x) => x.n), a.n, "Agent"))}
      ${field("Scope", select("scope", ["AU family · 9 placeholder narratives", "CM family · 9 placeholder narratives", "SI family · 8 placeholder narratives", "Every placeholder narrative · 74"], "AU family · 9 placeholder narratives", "Scope"), "", "Counts are SSP 3's placeholder narratives by family")}
      ${field("Notify", `<div class="v8w-opts">${check("notify", "Tell me when it finishes", true)}</div>`)}`,
      footer: submitFoot("Start run", "run", a.id) };
  };

  // ═════════════ 4. Roles & permissions (Settings): Roles · Permissions · Members · Changes ═════════════
  // Real: the workspace roles the database allows, the one membership it holds, every program role assignment with its period, and the
  // rules the database enforces. Invented: the other members' workspace roles, last active, the proposed rules and the example changes.
  const RW = { authorizing_official: "Authorizing official", lead_assessor: "Lead assessor", assessor: "Assessor", security_manager: "ISSM", security_officer: "ISSO", system_owner: "System owner", program_manager: "Program manager", control_owner: "Control owner", reviewer: "Reviewer" };
  const PSHORT = { "WS-X90 Sentinel Mission System": "WS-X90", "Customer A · X800 Rail Integration": "Customer A · X800 Rail", "Customer B · X800 Palletized Integration": "Customer B · X800 Palletized", "Customer C · G25 Battery Control Fielding": "Customer C · G25 Battery", "Atlas payments platform": "Atlas payments", "Legacy billing gateway": "Legacy billing", "Northwind data warehouse": "Northwind", "Field operations mobile": "Field operations mobile" };
  // program_role_assignments, read Nov 18: [person, role, program, starts_on, recorded]
  const PRA = [["Amara Bell", "control_owner", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Amara Bell", "control_owner", "Customer B · X800 Palletized Integration", "2026-09-01", "2026-11-13"],
    ["D. Okafor", "lead_assessor", "Atlas payments platform", "", "2026-11-17"], ["D. Okafor", "lead_assessor", "Legacy billing gateway", "", "2026-11-17"], ["D. Okafor", "lead_assessor", "WS-X90 Sentinel Mission System", "", "2026-11-17"],
    ["Dan Whitfield", "system_owner", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Elena Vasquez", "assessor", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Elena Vasquez", "lead_assessor", "Customer A · X800 Rail Integration", "", "2026-11-17"],
    ["Elena Vasquez", "assessor", "Customer C · G25 Battery Control Fielding", "", "2026-11-13"], ["Elena Vasquez", "lead_assessor", "Customer C · G25 Battery Control Fielding", "", "2026-11-17"], ["Hana Lindqvist", "system_owner", "Customer B · X800 Palletized Integration", "2026-09-01", "2026-11-13"],
    ["Ingrid Solberg", "control_owner", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Joel Barrantes", "security_officer", "Customer B · X800 Palletized Integration", "2026-09-01", "2026-11-13"], ["Joel Barrantes", "security_officer", "Customer C · G25 Battery Control Fielding", "", "2026-11-13"],
    ["Joel Barrantes", "security_manager", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["Local developer", "assessor", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["Marcus Ryde", "system_owner", "Northwind data warehouse", "", "2026-09-12"],
    ["Nadia Fournier", "security_officer", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Nadia Fournier", "assessor", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["Priya Raghavan", "system_owner", "Field operations mobile", "", "2026-09-12"],
    ["Priya Raghavan", "security_officer", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["R. Calloway", "authorizing_official", "Atlas payments platform", "", "2026-11-17"], ["R. Calloway", "authorizing_official", "Legacy billing gateway", "", "2026-11-17"],
    ["R. Calloway", "authorizing_official", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["Ray Colston", "assessor", "Customer B · X800 Palletized Integration", "2026-09-01", "2026-11-13"], ["Ray Colston", "lead_assessor", "Customer B · X800 Palletized Integration", "", "2026-11-17"],
    ["Ray Colston", "system_owner", "WS-X90 Sentinel Mission System", "", "2026-11-17"], ["Sarah Chen", "program_manager", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Tom Okafor", "program_manager", "Customer B · X800 Palletized Integration", "2026-09-01", "2026-11-13"],
    ["Victor Amsel", "reviewer", "Customer A · X800 Rail Integration", "2026-07-01", "2026-11-13"], ["Wes Duarte", "program_manager", "Customer C · G25 Battery Control Fielding", "", "2026-11-13"]];
  // The workspace's people (parties): [name, email, workspace role, last active]. Only Local developer's membership is real (owner).
  const MEMBERS = [["Local developer", "developer@program-assurance.local", "owner", "Today 10:41"], [ME, "i.solberg@equinox.mil", "editor", "Now"], ["Priya Raghavan", "p.raghavan@equinox.mil", "editor", "Today 10:38"],
    ["Joel Barrantes", "j.barrantes@equinox.mil", "admin", "Today 9:57"], ["Ray Colston", "r.colston@equinox.mil", "editor", "Yesterday"], ["R. Calloway", "", "editor", "Nov 12"], ["D. Okafor", "", "assessor", "Today 10:02"],
    ["Nadia Fournier", "n.fournier@equinox.mil", "assessor", "Nov 16"], ["Marcus Ryde", "m.ryde@equinox.mil", "editor", "Today 8:15"], ["Victor Amsel", "v.amsel@equinox.mil", "editor", "Nov 14"], ["Amara Bell", "a.bell@equinox.mil", "editor", "Nov 13"],
    ["Wes Duarte", "w.duarte@equinox.mil", "editor", "Nov 10"], ["Elena Vasquez", "e.vasquez@equinox.mil", "assessor", "Nov 15"], ["Dan Whitfield", "d.whitfield@equinox.mil", "editor", "Nov 9"], ["Hana Lindqvist", "h.lindqvist@equinox.mil", "editor", "Nov 11"],
    ["Sarah Chen", "s.chen@equinox.mil", "viewer", "Oct 30"], ["Tom Okafor", "t.okafor@equinox.mil", "viewer", "Nov 2"]]
    .map(([n, mail, wr, last]) => ({ n, mail, wr, last, real: n === "Local developer", roles: PRA.filter((x) => x[0] === n).map((x) => [x[1], PSHORT[x[2]] || x[2], x[3], x[4], x[2]]) }));
  const WROLES = [
    { id: "owner", n: "Owner", real: true, does: "Everything an admin does, and owns the workspace" },
    { id: "admin", n: "Admin", real: true, does: "Manages members, settings and reference data; writes every record" },
    { id: "editor", n: "Editor", real: true, does: "Creates and edits records; row-level security decides each write" },
    { id: "viewer", n: "Viewer", real: true, does: "Reads the workspace and writes nothing" },
    { id: "assessor", n: "Assessor", real: false, does: "An outside SCA: reads what a program shares, writes draft assessment results" },
  ];
  const WRN = Object.fromEntries(WROLES.map((r) => [r.id, r.n]));
  const ws = (n) => PRA.filter((x) => x[2] === "WS-X90 Sentinel Mission System" && RW[x[1]] && ["authorizing_official", "lead_assessor", "assessor", "security_manager", "security_officer", "system_owner"].includes(x[1]));
  const PROLE = [["authorizing_official", "Authorizing official", "AO", "Records the authorization decision on WS-X90's packages", true],
    ["lead_assessor", "Lead assessor", "SCA", "Publishes WS-X90's assessment results", true], ["assessor", "Assessor", "SCA", "Judges controls in a draft of the results", false],
    ["security_manager", "Information system security manager", "ISSM", "Approves the security plan and the POA&M", false], ["security_officer", "Information system security officer", "ISSO", "Runs day-to-day security: evidence, issues, risks", false],
    ["system_owner", "System owner", "", "Owns WS-X90 and signs its security plan", false]];
  const holders = (role) => ws().filter((x) => x[1] === role).map((x) => x[0]);
  const RULES = [
    ["Only today's authorizing official records an authorization decision on WS-X90's packages, and is named its decision maker", "Only R. Calloway, the authorizing official of WS-X90 Sentinel Mission System, can record its authorization decisions."],
    ["Only today's lead assessor publishes WS-X90's assessment results, and is named their publisher", "Only D. Okafor, the lead assessor of WS-X90 Sentinel Mission System, can publish its assessment results."],
    ["One authorizing official and one lead assessor at a time; a holder hands over by ending their days", "R. Calloway is already the authorizing official of WS-X90 Sentinel Mission System on those days. A program has one authorizing official at a time: end their days first."],
    ["A viewer reads and writes nothing; every other member writes, and row-level security decides each write", null],
    ["Where a program records neither role, every command acts as before", null],
  ];
  const permTabs = (cur) => AK.tabs([["Roles", WROLES.length + PROLE.length, cur === "roles" ? null : "permissions", cur === "roles"], ["Permissions", OBJS.length, cur === "matrix" ? null : "permissions-matrix", cur === "matrix"], ["Members", MEMBERS.length, cur === "members" ? null : "permissions-members", cur === "members"], ["Changes", CHANGES().length, cur === "changes" ? null : "permissions-changes", cur === "changes"]], "Roles and permissions");
  const permHead = () => AK.indexHead({ title: "Roles & permissions", desc: "Who can do what in the workspace, and the RMF roles each program records", actions: `${btn("Export", `data-v8w-toast="Roles and permissions exported (.csv)"`)}${btn(`${AK.i("plus")}Invite`, 'data-modal="v8w-invite"', true)}` });
  const DB = `<span class="v8w-db" title="The database enforces this rule today">DB</span>`;
  S.permissions = () => h.page(
    permHead(), permTabs("roles"),
    sec("Workspace roles", tbl({ cols: ["Role", "What it can do", "Members", "Source"], label: "Workspace roles", panel: "v8w-role", pager: false,
      rows: WROLES.map((r) => ({ id: r.id, cells: [`<b>${esc(r.n)}</b>`, tr(r.does, 400), num(MEMBERS.filter((m) => m.wr === r.id).length), r.real ? `${DB} ${mu("Database")}` : `${mu("Proposed")} ${EX}`] })) }), { count: WROLES.length }),
    sec("RMF roles on WS-X90", tbl({ cols: ["Role", "Holds", "Today", "Period", "At a time"], label: "RMF roles on WS-X90", panel: "v8w-role", pager: false,
      rows: PROLE.map(([k, l, ab, holds, one]) => { const hs = holders(k); return { id: k, cells: [`<b>${esc(ab === "ISSM" || ab === "ISSO" ? ab : l)}</b>${ab === "ISSM" ? ` ${mu("security manager")}` : ab === "ISSO" ? ` ${mu("security officer")}` : ab ? ` ${mu(esc(ab))}` : ""}`, tr(holds, 250), `<span class="v8w-avrow">${hs.length ? hs.map((n) => AK.owner(n)).join("") : AK.owner(null)}</span>`, mu("Since Nov 17 · open"), one ? `${pill("info", "One")} ${DB}` : mu("Several")] }; }) }), { count: PROLE.length }),
    sec("What the database enforces", `<div class="v8w-rules">${RULES.map(([r, q]) => `<div class="v8w-rule">${gl("check")}<span><b>${esc(r)}</b>${q ? `<small>Refusal: “${esc(q)}”</small>` : ""}</span>${DB}</div>`).join("")}</div>`, { count: RULES.length }),
    AK.note("The Assessor workspace role is proposed. The other four roles, the RMF roles with today's holders and the rules are the database's."),
  );
  // Permissions: objects by actions, per role. Y/N/C: the database's rule; y/n/c: proposed; "-": doesn't apply.
  const OBJS = ["Programs", "Plans (SSP and others)", "Controls and requirements", "Evidence", "Risks and risk acceptance", "POA&M", "Assessments and results", "Authorization packages", "Settings"];
  const ACTS = ["View", "Create", "Edit", "Approve", "Sign or decide", "Publish"];
  const AO = "C:Only today's authorizing official, R. Calloway", LA = "C:Only today's lead assessor, D. Okafor";
  const MEMBER = [["Y", "Y", "Y", "-", "-", "-"], ["Y", "Y", "Y", "c:Only the ISSM approves a plan for review", "c:Only the system owner signs a plan", "c:After the ISSM's approval"], ["Y", "Y", "Y", "-", "-", "-"], ["Y", "Y", "Y", "c:A reviewer who didn't collect it", "-", "-"],
    ["Y", "Y", "Y", "c:The ISSO, then the ISSM", "c:Only today's authorizing official accepts a risk", "-"], ["Y", "Y", "Y", "c:The ISSM approves a milestone change", "-", "-"], ["Y", "Y", "Y", "-", "-", LA], ["Y", "Y", "Y", "c:The ISSM, before submission", AO, "-"]];
  const MX = {
    owner: [...MEMBER, ["Y", "y", "y", "-", "-", "-"]], admin: [...MEMBER, ["Y", "y", "y", "-", "-", "-"]], editor: [...MEMBER, ["Y", "n:Owners and admins", "n:Owners and admins", "-", "-", "-"]],
    viewer: OBJS.map(() => ["Y", "N", "N", "N", "N", "N"]),
    assessor: [["c:Programs that share with the assessor", "n", "n", "-", "-", "-"], ["c:Shared plans", "n", "n", "-", "-", "-"], ["c:Shared", "n", "n", "-", "-", "-"], ["c:Shared evidence", "n", "c:Flag for the program", "-", "-", "-"], ["c:Shared", "n", "n", "-", "-", "-"], ["c:Shared", "n", "n", "-", "-", "-"], ["c:Their own campaigns", "c:Draft results", "c:Their own drafts", "-", "-", LA], ["c:Shared", "n", "n", "-", "-", "-"], ["n", "n", "n", "-", "-", "-"]],
    authorizing_official: [["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "y:Accepts a risk, last in its chain", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "Y:R. Calloway holds it today", "-"], ["-", "-", "-", "-", "-", "-"]],
    lead_assessor: [["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "y", "-", "Y:D. Okafor holds it today"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"]],
    security_manager: [["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "y", "-", "y"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "y:Second in the acceptance chain", "-", "-"], ["-", "-", "-", "y", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "y:Before submission", "-", "-"], ["-", "-", "-", "-", "-", "-"]],
    security_officer: [["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "y", "-", "-"], ["-", "-", "-", "y:First in the acceptance chain", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"]],
    system_owner: [["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "y", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"], ["-", "y:Submits the package", "-", "-", "-", "-"], ["-", "-", "-", "-", "-", "-"]],
  };
  const MXR = [["Workspace roles", [["owner", "Owner"], ["admin", "Admin"], ["editor", "Editor"], ["viewer", "Viewer"], ["assessor", "Assessor"]]], ["RMF roles on WS-X90", [["authorizing_official", "AO"], ["lead_assessor", "Lead assessor"], ["security_manager", "ISSM"], ["security_officer", "ISSO"], ["system_owner", "System owner"]]]];
  const cell = (v, rmf) => {
    if (v === "-") return `<span class="v8w-c na" title="${rmf ? "From the workspace role" : "Doesn't apply"}">—<span class="v8w-sr">${rmf ? "From the workspace role" : "Doesn't apply"}</span></span>`;
    const [k, cond] = [v[0], v.slice(2)], db = k === k.toUpperCase();
    const t = k.toLowerCase(), tone = t === "y" ? "ok" : t === "c" ? "part" : "no";
    const label = t === "y" ? (cond || "Allowed") : t === "c" ? cond : (cond || "Not allowed");
    const tip = `${t === "y" ? "Allowed" : t === "c" ? "Allowed with a condition" : "Not allowed"}${t === "c" || (t !== "c" && cond) ? ": " + cond : ""} · ${db ? "the database's rule" : "proposed"}`;
    return `<span class="v8w-c ${tone}${db ? " db" : ""}" title="${esc(tip)}">${t === "y" ? gl("check") : t === "c" ? gl("part") : AK.i("ban")}<span class="v8w-ct">${esc(t === "y" && !cond ? "Allowed" : t === "n" && !cond ? "Not allowed" : label)}</span>${db ? DB : ""}</span>`;
  };
  S["permissions-matrix"] = () => {
    const role = QV.pmr || "editor", rmf = !WRN[role], m = MX[role];
    const allL = MXR.flatMap(([, l]) => l), roleL = (allL.find(([k]) => k === role) || [role, role])[1];
    return h.page(
      permHead(), permTabs("matrix"),
      `<div class="v8w-rolesel">${MXR.map(([g, list]) => `<div class="v8w-rs-g"><span class="v8w-rs-k">${esc(g)}</span><div class="views" role="group" aria-label="${esc(g)}">${list.map(([k, l]) => `<button type="button" class="qv${role === k ? " on" : ""}" aria-pressed="${role === k}" data-v8w-q="pmr" data-v8w-v="${k}">${esc(l)}</button>`).join("")}</div></div>`).join("")}</div>`,
      `<div class="v8w-legend"><span>${gl("check")}Allowed</span><span>${gl("part")}With a condition (hover for it)</span><span>${AK.i("ban")}Not allowed</span><span>${DB} The database enforces it today</span><span>Unmarked: proposed ${EX}</span></div>`,
      tbl({ cols: [`${esc(roleL)}${rmf ? " · adds to the workspace role" : ""}`, ...ACTS], label: `Permissions of ${roleL}`, pager: false, cls: "v8w-mx",
        rows: OBJS.map((o, i) => ({ panel: "", cells: [`<b>${esc(o)}</b>`, ...m[i].map((v) => cell(v, rmf))] })) }),
      AK.note("Cells marked DB are the database's rules today; every other cell is a proposal, as is the Assessor role."),
    );
  };
  const roleCell = (m) => m.roles.length ? `<span class="v8w-roles">${m.roles.slice(0, 1).map(([r, p]) => `<span class="tag">${esc(RW[r])} · ${esc(p)}</span>`).join("")}${m.roles.length > 1 ? mu(`+${m.roles.length - 1}`) : ""}</span>` : mu("None");
  S["permissions-members"] = () => {
    const f = QV.pmm || "all", rows = MEMBERS.filter((m) => f === "all" || (f === "wsx" ? m.roles.some((r) => r[1] === "WS-X90") : m.wr === f));
    return h.page(
      permHead(), permTabs("members"),
      chips("pmm", [["all", "All", MEMBERS.length], ["wsx", "On WS-X90", MEMBERS.filter((m) => m.roles.some((r) => r[1] === "WS-X90")).length], ["admin", "Admins and owners", MEMBERS.filter((m) => m.wr === "admin" || m.wr === "owner").length], ["assessor", "Assessors", MEMBERS.filter((m) => m.wr === "assessor").length], ["viewer", "Viewers", MEMBERS.filter((m) => m.wr === "viewer").length]]),
      filters("Search members", ["Workspace role", "Program", "Program role"]),
      tbl({ cols: ["Person", "Workspace role", "Program roles", "Since", "Last active", `<span class="v8w-sr">Actions</span>`], label: "Members", panel: "v8w-member",
        rows: rows.map((m) => ({ id: m.n, cells: [`<span class="v8w-person">${AK.avatar(m.n, 28)}<span><b>${esc(m.n)}</b><small>${esc(m.mail || "No email recorded")}</small></span></span>`, `${tag(WRN[m.wr])}${m.real ? ` ${DB}` : ` ${EX}`}`, roleCell(m),
          m.roles.length ? `<span class="num">${m.roles[0][2] ? AK.md(m.roles[0][2]) : "Recorded " + AK.md(m.roles[0][3])}</span>` : mu("—"), `<span class="num">${esc(m.last)}</span>`, m.wr === "owner" ? `<span class="v8w-mu" title="The owner's role changes by transferring ownership">Owner</span>` : btn("Change role", `data-modal="v8w-role-change" data-id="${esc(m.n)}" aria-label="Change ${esc(m.n)}'s role"`)] })), total: rows.length }),
      AK.note("People, emails and program roles with their periods are the workspace's. Only Local developer's workspace role (owner) is recorded; the others and Last active are invented."),
    );
  };
  // Changes: the program roles the seed recorded (real), and the example changes made with a reason.
  const CHG_EX = [
    { when: "Today 9:20", day: "2026-11-17", who: "Joel Barrantes", what: ["Nadia Fournier", "Editor", "Assessor"], scope: "Workspace", why: "She assesses WS-X90 for the SCA from Dec 1 and should read only what we share.", ex: true },
    { when: "Nov 16", day: "2026-11-16", who: "Joel Barrantes", what: ["Evidence · Approve (Editor)", "Allowed", "A reviewer who didn't collect it"], scope: "Workspace", why: "Separation of duties, AC-5: the collector of evidence doesn't accept it.", ex: true },
    { when: "Nov 14", day: "2026-11-14", who: "Local developer", what: ["Joel Barrantes", "Editor", "Admin"], scope: "Workspace", why: "The ISSM manages members and reference data.", ex: true },
  ];
  const ADDED = [];
  const CHANGES = () => {
    const groups = {};
    for (const [n, r, p, , rec] of PRA) { const k = rec + "|" + p; (groups[k] = groups[k] || { day: rec, p, list: [] }).list.push([n, r]); }
    const real = Object.values(groups).map((g) => ({ when: AK.md(g.day), day: g.day, who: "Program Assurance", what: null, rec: g, scope: PSHORT[g.p] || g.p, why: g.day === "2026-11-17" ? "Roles held to acts: the AO and the lead assessor are named" : "Program setup", real: true }));
    return [...ADDED, ...CHG_EX, ...real].sort((a, b) => (b.day + (b.ex ? "1" : "0")).localeCompare(a.day + (a.ex ? "1" : "0")));
  };
  const chgText = (c) => c.rec ? `Recorded ${c.rec.list.length === 1 ? `${esc(c.rec.list[0][0])} as ${esc(RW[c.rec.list[0][1]].toLowerCase())}` : `${c.rec.list.length} program roles: ${esc(c.rec.list.slice(0, 2).map(([n, r]) => `${n} ${RW[r]}`).join(", "))}${c.rec.list.length > 2 ? "…" : ""}`}` : `${esc(c.what[0])} ${AK.change(c.what[1], c.what[2])}`;
  S["permissions-changes"] = () => {
    const list = CHANGES();
    return h.page(
      permHead(), permTabs("changes"),
      filters("Search changes", ["Who", "Scope", "Kind"]),
      tbl({ cols: ["When", "Who", "Change", "Scope", "Reason"], label: "Role and permission changes", panel: "v8w-change",
        rows: list.map((c, i) => ({ id: String(i), cells: [`<span class="num">${esc(c.when)}</span>`, c.real ? mu("Program Assurance") : `<span class="v8w-avrow">${AK.owner(c.who)}${EX}</span>`, `<span class="v8w-chg">${chgText(c)}</span>`, tr(c.scope, 150), tr(c.why, 230)] })), total: list.length }),
      AK.note("Rows recorded by Program Assurance are the program role assignments in the database, by the day they were recorded; the others are invented."),
    );
  };
  P["v8w-role"] = (id) => {
    const w = WROLES.find((r) => r.id === id), p = PROLE.find((r) => r[0] === id);
    if (w) {
      const mem = MEMBERS.filter((m) => m.wr === w.id);
      return { label: "Role preview", body: `<div class="v8w-pan">${AK.recordHead({ title: w.n, chip: w.real ? DB : pill("none", "Proposed"), actions: btn("Open permissions", `data-v8w-set="pmr:${w.id}" data-go="permissions-matrix"`, true) })}
        <p class="ak-desc">${esc(w.does)}.</p>
        ${sec("Members", mem.length ? mem.map((m) => li(AK.avatar(m.n, 22), esc(m.n), m.real ? DB : EX)).join("") : `<p class="v8w-p">Nobody holds this role yet.</p>`, { count: mem.length })}
        ${AK.note(w.real ? "The role is the database's; who holds it, but the owner, is invented." : "The Assessor workspace role is proposed.")}</div>` };
    }
    const [k, l, ab, holds, one] = p || PROLE[0], hs = holders(k);
    const rule = k === "authorizing_official" ? RULES[0] : k === "lead_assessor" ? RULES[1] : null;
    return { label: "Role preview", body: `<div class="v8w-pan">${AK.recordHead({ title: l, chip: one ? pill("info", "One at a time") : "", actions: btn("Open permissions", `data-v8w-set="pmr:${k}" data-go="permissions-matrix"`, true) })}
      <p class="ak-desc">${esc(holds)}.</p>
      ${AK.facts([["Program", "WS-X90"], ["Today", hs.map((n) => AK.owner(n)).join(" ") || AK.owner(null)], ["Period", "Since recorded Nov 17 · no end"], ["Abbreviation", esc(ab || "—")]])}
      ${rule ? sec("Held to it", `<div class="v8w-rule">${gl("check")}<span><b>${esc(rule[0])}</b><small>Refusal: “${esc(rule[1])}”</small></span>${DB}</div>`) : ""}
      ${sec("Other programs", PRA.filter((x) => x[1] === k && x[2] !== "WS-X90 Sentinel Mission System").map((x) => li(AK.avatar(x[0], 22), `${esc(x[0])} · ${esc(PSHORT[x[2]] || x[2])}`, x[3] ? mu(`From ${AK.md(x[3])}`) : "")).join("") || `<p class="v8w-p">No other program records this role.</p>`)}
      ${AK.note("Holders, periods and the rules are the database's.")}</div>` };
  };
  P["v8w-member"] = (n) => {
    const m = MEMBERS.find((x) => x.n === n) || MEMBERS[1];
    const mine = CHANGES().filter((c) => (c.what && c.what[0] === m.n) || (c.rec && c.rec.list.some(([x]) => x === m.n)));
    return { label: "Member preview", body: `<div class="v8w-pan">${AK.recordHead({ title: m.n, chip: tag(WRN[m.wr]), actions: m.wr === "owner" ? "" : btn("Change role", `data-modal="v8w-role-change" data-id="${esc(m.n)}"`, true) })}
      ${AK.facts([["Email", esc(m.mail || "Not recorded")], ["Workspace role", `${esc(WRN[m.wr])} ${m.real ? DB : EX}`], ["Last active", `${esc(m.last)} ${m.real ? "" : EX}`]])}
      ${sec("Program roles", m.roles.length ? m.roles.map(([r, p, from, rec]) => li(gl("check"), `<b>${esc(RW[r])}</b> · ${esc(p)}`, mu(from ? `From ${AK.md(from)} · no end` : `Recorded ${AK.md(rec)} · no end`))).join("") : `<p class="v8w-p">No program records a role for ${esc(m.n)}.</p>`, { count: m.roles.length })}
      ${sec("Changes", mine.length ? AK.activity(mine.slice(0, 5).map((c) => ({ who: c.real ? null : c.who, what: c.rec ? `recorded ${esc(m.n)} as ${esc(RW[(c.rec.list.find(([x]) => x === m.n) || [0, "assessor"])[1]].toLowerCase())} on ${esc(c.scope)}` : `changed ${esc(c.what[0])}: ${esc(c.what[1])} to ${esc(c.what[2])}`, when: c.when }))) : `<p class="v8w-p">No changes recorded.</p>`)}
      ${AK.note("Program roles and periods are the database's; the workspace role, but the owner's, and Last active are invented.")}</div>` };
  };
  P["v8w-change"] = (i) => {
    const c = CHANGES()[+i] || CHANGES()[0];
    return { label: "Change preview", body: `<div class="v8w-pan">${AK.recordHead({ title: c.rec ? `Program roles recorded on ${c.scope}` : c.what[0] })}
      ${AK.facts([["When", esc(c.when)], ["Who", c.real ? "Program Assurance" : AK.owner(c.who)], ["Scope", esc(c.scope)]])}
      ${c.rec ? sec("Recorded", c.rec.list.map(([n, r]) => li(AK.avatar(n, 22), `${esc(n)} · ${esc(RW[r])}`)).join(""), { count: c.rec.list.length }) : sec("Change", `<div class="v8w-p">${AK.change(c.what[1], c.what[2])}</div>`)}
      ${AK.reasonCard({ question: "Why", reason: c.why, who: c.real ? "Program Assurance" : c.who, when: c.when })}
      ${AK.note(c.real ? "A real assignment, as the database records it." : "An invented change.")}</div>` };
  };
  M["v8w-invite"] = () => ({ title: "Invite a member", body: `<p class="ak-desc">They get an email. Their workspace role decides what they can do; a program role holds them to its acts.</p>
    <div class="v8w-two">${field("Email", input("email", "", "Email", "name@equinox.mil"), REQ)}${field("Name", input("name", "", "Name", "First and last name"), OPT)}</div>
    ${field("Workspace role", `<div class="v8w-opts">${radio("wr", "editor", "Editor", true, "Creates and edits records")}${radio("wr", "viewer", "Viewer", false, "Reads and writes nothing")}${radio("wr", "admin", "Admin", false, "Manages members and settings")}${radio("wr", "assessor", `Assessor ${EX}`, false, "An outside SCA: reads what is shared")}</div>`)}
    <div class="v8w-two">${field("Program role", select("prole", ["None", "Assessor on WS-X90", "ISSO on WS-X90", "ISSM on WS-X90", "System owner on WS-X90"], "None", "Program role"), OPT)}${field("Starts", input("starts", "Nov 17, 2026", "Starts"), OPT)}</div>
    ${field("Reason", area("reason", "", "Reason", "Why do they need access? The reason shows in Changes, with your name and the date."), REQ)}
    ${err("Give an email address and a reason.")}`, footer: submitFoot("Send invitation", "invite") });
  M["v8w-role-change"] = (n) => {
    const m = MEMBERS.find((x) => x.n === n) || MEMBERS[1];
    return { title: `Change ${m.n}'s role`, body: `<p class="ak-desc">Now <b>${esc(WRN[m.wr])}</b>. The change applies at once and shows in Changes with its reason.</p>
      ${field("Workspace role", `<div class="v8w-opts">${WROLES.filter((r) => r.id !== "owner").map((r) => radio("wr", r.id, `${esc(r.n)}${r.real ? "" : " " + EX}`, r.id === m.wr, esc(r.does))).join("")}</div>`)}
      ${field("Reason", area("reason", "", "Reason", "Why is this changing?"), REQ)}${err("Choose another role and say why.")}`, footer: submitFoot("Change role", "role", m.n) };
  };

  // ═════════════ 5. Risk library (risks-library, a tab on Risks) ═════════════
  // Real: the 263 ATT&CK techniques NIST SP 800-160 Vol. 2 Rev. 1 prints in Appendix F (Enterprise) and G (ICS), with their tactics,
  // mitigations and countering controls, WS-X90's status on each control (PA.SSP) and the risks that name each technique.
  // Invented: the weapon system scenarios, their likelihood and impact, custom scenarios.
  const TECH = D8.techs.map(([c, t, m, ta, mi, ct, tbls]) => ({ id: c, c, t, m, tac: ta.map((i) => D8.tac[i]), mit: mi, ctl: ct.map((i) => D8.ctls[i]), tbls }));
  const TBY = Object.fromEntries(TECH.map((x) => [x.c, x]));
  const USE = {}; for (const r of RISKS) for (const t of r.tech) (USE[t] = USE[t] || []).push(r);
  const MATRIX = { F: ["ATT&CK for Enterprise", "Appendix F"], G: ["ATT&CK for ICS", "Appendix G"] };
  const el = (code) => { const e = ELS.find((x) => x[0] === code); return e ? [e[0], e[1], e[4]] : [code, code, null]; };
  const SCN = [
    { id: "ws1", t: "Firmware tampered during depot maintenance", src: "A depot technician, or a compromised maintenance tool", ev: "Unsigned firmware is loaded on an LRU during depot maintenance and persists past secure boot", pre: "The depot maintenance enclave reaches WS-X90 through the Maintenance Access Gateway (MOA, signed Mar 2, 2026)", lik: "Moderate", imp: "High", tech: ["T1542", "T1495", "T0857", "T0839"], els: ["CN-109116", "CN-109102", "CN-109114"] },
    { id: "ws2", t: "GPS spoofing of the navigation subsystem", src: "An adversary's electronic warfare unit", ev: "Spoofed GNSS signals shift the platform's position and time reference", pre: "The Timing Receiver falls back to an unauthenticated civil signal when the military code is unavailable", lik: "Moderate", imp: "High", tech: ["T0856", "T0832", "T0831"], els: ["CN-109002", "CN-109105", "CN-109106", "CN-109104"] },
    { id: "ws3", t: "Tactical data link jamming", src: "Adversary electronic attack", ev: "The tactical data link is jammed during a mission phase, cutting position reports and tasking", pre: "One radio path carries position reports and tasking (ISA renewal due Jan 15, 2027)", lik: "High", imp: "Moderate", tech: ["T0814", "T0815", "T1498"], els: ["CN-109108", "CN-109003"] },
    { id: "ws4", t: "A counterfeit part in the supply chain", src: "A sub-tier supplier, or a broker outside the authorized channel", ev: "A counterfeit or tampered part is fitted and fails, or behaves maliciously, in operation", pre: "Receiving inspection attests 24 units of LRU-004, LRU-006 and LRU-008 only", lik: "Low", imp: "High", tech: ["T1195", "T0862", "T1200"], els: ["CN-109101", "CN-109103", "CN-109104"] },
    { id: "ws5", t: "A mission data load from an untrusted planning system", src: "A compromised mission planning network", ev: "A tampered mission data load is accepted and drives navigation or payload behaviour", pre: "Mission plans arrive over TLS 1.3 on 443/tcp from the mission planning network (ISA, signed Jun 30, 2026)", lik: "Moderate", imp: "High", tech: ["T1199", "T1565", "T0873"], els: ["CN-109107", "CN-109101", "CN-109110"] },
    { id: "ws6", t: "Removable media carries malware onto the platform", src: "A maintainer's media, infected off-platform", ev: "Malware on removable media reaches the Maintenance Laptop or Provisioning Workstation and spreads to an LRU", pre: "USB mass storage is not disabled on the Provisioning Workstation (an open CAT I)", lik: "Moderate", imp: "Moderate", tech: ["T1091", "T0847"], els: ["CN-109119", "CN-109117"] },
  ];
  const CUSTOM = [];
  const USED = {}; // scenario or technique id -> risks created from it this session
  const scnAll = () => [...SCN, ...CUSTOM];
  const scnById = (id) => scnAll().find((s) => s.id === id);
  const ctlsOf = (s) => [...new Set(s.tech.flatMap((t) => (TBY[t] ? TBY[t].ctl : [])))];
  const inBase = (list) => list.filter((c) => ctl(c));
  const shortOf = (list) => inBase(list).filter((c) => ctl(c).cs !== "satisfied");
  const LIBN = () => TECH.length + scnAll().length;
  const useOf = (id) => (USE[id] ? USE[id].length : 0) + (USED[id] || 0);
  const suggest = (x) => { const b = inBase(x.ctl), sat = b.filter((c) => ctl(c).cs === "satisfied").length; return [sat >= Math.ceil(x.ctl.length / 2) ? "Low" : sat ? "Moderate" : "High", x.tac.includes("Impact") || x.m === "G" ? "High" : "Moderate"]; };
  const tacCell = (list) => `<span class="v8w-tags v8w-one">${list.slice(0, 1).map((t) => tag(t)).join(" ")}${list.length > 1 ? mu(`+${list.length - 1}`) : ""}</span>`;
  const baseCell = (list) => { const b = inBase(list).length; return list.length ? `<span class="num">${b} of ${list.length}</span>` : mu("None printed"); };
  const useCell = (n) => (n ? `<span class="num">${plural(n, "risk")}</span>` : mu("None"));
  // The register's tab bar gains Library on every Risks screen.
  PA.decorate(/^risks(-|$)/, (html, r) => {
    if (html.includes("data-v8w-libtab")) return html;
    const i = html.indexOf('class="ak-tabs"'); if (i < 0) return html;
    const j = html.indexOf("</div>", i); if (j < 0) return html;
    const on = r === "risks-library";
    return html.slice(0, j) + `<span role="tab" aria-selected="${on}" class="ak-tab${on ? " on" : ""}" data-v8w-libtab${on ? "" : ' data-go="risks-library" tabindex="0"'}>Library<span class="ct num">${fmt(LIBN())}</span></span>` + html.slice(j);
  });
  const libHead = () => {
    const base = has("risks") ? S.risks() : "", i = base.indexOf('class="ak-tabs"'), j = i < 0 ? -1 : base.indexOf("</div>", i);
    if (j < 0) return AK.indexHead({ title: "Risks", desc: "WS-X90 risk register", actions: btn("Create risk", 'data-modal="v8w-risk-new" data-id=""', true) }) + AK.tabs([["Register", RISKS.length, "risks", false], ["Library", LIBN(), null, true]], "Risk register");
    const head = base.slice(base.indexOf(">") + 1, j + 6); // drop the opening <div class="main">
    return head.replace(/<span role="tab" aria-selected="true" class="ak-tab on">([^<]*)/, '<span role="tab" aria-selected="false" class="ak-tab" data-go="risks" tabindex="0">$1')
      .replace(/<span role="tab" aria-selected="false" class="ak-tab" data-v8w-libtab data-go="risks-library" tabindex="0">/, '<span role="tab" aria-selected="true" class="ak-tab on" data-v8w-libtab>');
  };
  const rowsFor = (list, f) => list.map((x) => ({ id: x.id, cells: [`<span class="v8w-scn">${x.c ? code(x.c) + " " : ""}${tr(x.t, 330)}${x.custom ? " " + tag("Custom") : ""}</span>`, tacCell(x.c ? x.tac : [...new Set(x.tech.flatMap((t) => (TBY[t] ? TBY[t].tac : [])))]), x.c ? esc(MATRIX[x.m][0].replace("ATT&CK for ", "")) : esc(andList([...new Set(x.tech.map((c) => (TBY[c] ? MATRIX[TBY[c].m][0].replace("ATT&CK for ", "") : null)).filter(Boolean))]) || "None"), baseCell(x.c ? x.ctl : ctlsOf(x)), useCell(useOf(x.id))] }));
  S["risks-library"] = () => {
    const f = QV.lib || "all", open = QV["lib-open"] || "";
    const ent = TECH.filter((x) => x.m === "F").sort((a, b) => useOf(b.id) - useOf(a.id) || a.c.localeCompare(b.c)), ics = TECH.filter((x) => x.m === "G").sort((a, b) => useOf(b.id) - useOf(a.id) || a.c.localeCompare(b.c));
    const inUse = TECH.filter((x) => useOf(x.id));
    const grp = (key, label, n, chip, list, cap = 8) => {
      const all = open.split(",").includes(key), shown = all ? list : list.slice(0, cap);
      return [{ raw: `<td colspan="5"><span class="v8w-grp-n">${esc(label)}</span><span class="num v8w-mu">${fmt(n)}</span>${chip}</td>` }, ...rowsFor(shown),
        ...(list.length > cap ? [{ raw: `<td colspan="5"><button type="button" class="v8w-more" data-v8w-libmore="${key}" aria-expanded="${all}">${all ? "Show fewer" : `Show all ${fmt(list.length)}`}</button></td>` }] : [])];
    };
    let rows = [];
    if (f === "all" || f === "ws") rows = rows.concat(grp("ws", "Weapon system scenarios", SCN.length, ` ${EX}`, SCN, 99));
    if ((f === "all" || f === "ws") && CUSTOM.length) rows = rows.concat(grp("custom", "Custom scenarios", CUSTOM.length, "", CUSTOM, 99));
    if (f === "all" || f === "F") rows = rows.concat(grp("F", "ATT&CK for Enterprise · Appendix F", ent.length, "", ent, f === "F" ? 25 : 8));
    if (f === "all" || f === "G") rows = rows.concat(grp("G", "ATT&CK for ICS · Appendix G", ics.length, "", ics, f === "G" ? 25 : 8));
    if (f === "use") rows = rows.concat(grp("use", "Named by WS-X90's risks", inUse.length, "", inUse.sort((a, b) => useOf(b.id) - useOf(a.id)), 99));
    return h.page(
      libHead(),
      `<div class="v8w-libsum"><span><b class="num">${fmt(TECH.length)}</b> techniques in Appendix F and G</span>${mu(`${fmt(ent.length)} ATT&amp;CK for Enterprise · ${fmt(ics.length)} ATT&amp;CK for ICS · ${fmt(inUse.length)} named by WS-X90's risks`)}<span class="v8w-push">${btn(`${AK.i("plus")}Add custom scenario`, 'data-modal="v8w-scn-new"')}</span></div>`,
      chips("lib", [["all", "All", LIBN()], ["ws", "Weapon system", SCN.length + CUSTOM.length], ["F", "Enterprise", ent.length], ["G", "ICS", ics.length], ["use", "In use", inUse.length]]),
      filters("Search the library", ["Tactic", "Element", "Countering control"]),
      tbl({ cols: ["Scenario", "Tactics", "Matrix", "Countering controls in WS-X90's baseline", "In use by"], label: "Risk scenarios", panel: "v8w-scn", rows, total: f === "all" ? LIBN() : rows.filter((r) => !r.raw).length, pager: f !== "all" }),
      AK.note("The weapon system scenarios, their likelihood and impact are invented. The ATT&CK techniques, tactics, mitigations and countering controls are NIST SP 800-160 Vol. 2 Rev. 1's; control statuses and the risks that use each are WS-X90's."),
    );
  };
  P["v8w-scn"] = (id) => {
    const t = TBY[id], s = t ? null : scnById(id) || SCN[0];
    const x = t || s, ctls = t ? t.ctl : ctlsOf(s), techs = t ? [t] : s.tech.map((c) => TBY[c]).filter(Boolean);
    const short = shortOf(ctls), base = inBase(ctls);
    const [lik, imp] = t ? suggest(t) : [s.lik, s.imp];
    const facts = t
      ? [["Threat source", `Adversarial · ${esc(MATRIX[t.m][0])}`], ["Event", `${esc(t.t)}, used for ${esc(andList(t.tac.map((y) => y.toLowerCase())))}`], ["Predisposing condition", base.length ? `${num(short.length)} of its ${num(base.length)} countering controls in WS-X90's baseline are short of satisfied` : "None of its countering controls is in WS-X90's baseline"], ["Suggested likelihood", `${esc(lik)} ${EX}`], ["Suggested impact", `${esc(imp)} ${EX}`], ["In use by", useCell(useOf(x.id))]]
      : [["Threat source", esc(s.src)], ["Event", esc(s.ev)], ["Predisposing condition", esc(s.pre)], ["Suggested likelihood", esc(s.lik)], ["Suggested impact", esc(s.imp)], ["In use by", useCell(useOf(x.id))]];
    const ctlRows = ctls.slice().sort((a, b) => (ctl(a) ? 0 : 1) - (ctl(b) ? 0 : 1) || a.localeCompare(b, undefined, { numeric: true }));
    const ctlList = ctlRows.slice(0, 12).map((c) => li(code(c), esc(ctl(c) ? ctl(c).t : "Not in WS-X90's baseline"), csPill(c), ctl(c) ? (c === "SI-2" ? opener("control-si2") : opener("controls", "v7p-obj", c)) : "")).join("") + (ctlRows.length > 12 ? `<p class="v8w-p">${num(ctlRows.length - 12)} more countering controls.</p>` : "");
    const users = t ? USE[t.c] || [] : RISKS.filter((r) => r.tech.some((c) => s.tech.includes(c)));
    return { label: t ? "ATT&CK technique preview" : "Scenario preview", body: `<div class="v8w-pan">${AK.recordHead({ title: t ? `${t.c} ${t.t}` : s.t, chip: t ? AK.chip(`${MATRIX[t.m][0]} · ${MATRIX[t.m][1]}`) : s.custom ? tag("Custom") : EX, actions: btn("Use this scenario", `data-modal="v8w-risk-new" data-id="${esc(x.id)}"`, true) })}
      ${AK.facts(facts)}
      ${sec(t ? "Tactics" : "ATT&CK techniques", t ? `<div class="v8w-tags">${t.tac.map((y) => AK.chip(y)).join("")}</div>` : techs.map((y) => li(code(y.c), esc(y.t), mu(esc(MATRIX[y.m][0].replace("ATT&CK for ", ""))), `data-panel="v8w-scn" data-id="${y.c}" role="link" tabindex="0"`)).join(""), { count: t ? t.tac.length : techs.length })}
      ${s ? sec("WS-X90 elements", s.els.map((c) => { const [k, n, lru] = el(c); return li(code(lru || k), esc(n)); }).join(""), { count: s.els.length }) : ""}
      ${t ? sec("Mitigations", t.mit.map((m) => li(code(m), esc(D8.mit[m] || m), m.startsWith("CM") ? mu("Candidate") : "")).join("") || `<p class="v8w-p">None printed.</p>`, { count: t.mit.length }) : ""}
      ${sec("Countering controls", ctlList || `<p class="v8w-p">None printed.</p>`, { count: ctls.length })}
      ${sec(t ? "Risks that name it" : "WS-X90 risks naming its techniques", users.length ? users.map((r) => li(h.sevPill ? h.sevPill(r.sev) : esc(SEV[r.sev]), `<span class="v8w-a" ${opener("risks", "a-risk-risk", r.id + "|overview")}>${esc(r.t)}</span>`)).join("") : `<p class="v8w-p">No WS-X90 risk names ${t ? "it" : "them"} yet.</p>`, { count: users.length })}
      <p class="v8w-src">${t ? `NIST SP 800-160 Vol. 2 Rev. 1, ${esc(MATRIX[t.m][1])}: Tables ${esc(t.tbls.replace(/^[FG]-/, "").replace(/, [FG]-/g, ", "))}.` : "Techniques and countering controls from NIST SP 800-160 Vol. 2 Rev. 1, Appendices F and G."}</p>
      ${AK.note(t ? "The suggested likelihood and impact are invented; everything else is the publication's or WS-X90's." : "The scenario and its likelihood and impact are invented; its techniques and controls are real.")}</div>` };
  };
  M["v8w-risk-new"] = (id) => {
    const t = TBY[id], s = t ? null : scnById(id);
    const x = t || s;
    const title = t ? `${t.t} (${t.c}) against WS-X90` : s ? s.t : "";
    const threat = t ? `An adversary uses ${t.t} for ${andList(t.tac.map((y) => y.toLowerCase()))} against WS-X90's elements.` : s ? `${s.src}. ${s.ev}.` : "";
    const techs = t ? [t] : s ? s.tech.map((c) => TBY[c]).filter(Boolean) : [];
    const ctls = x ? inBase(t ? t.ctl : ctlsOf(s)) : [];
    const [lik, imp] = t ? suggest(t) : s ? [s.lik, s.imp] : ["Moderate", "Moderate"];
    return { title: "Create risk", body: `${x ? `<p class="ak-desc">From the library: <b>${esc(t ? `${t.c} ${t.t}` : s.t)}</b>. Change anything before you create it.</p>` : ""}
      ${field("Title", input("title", title, "Title", "What could happen, to what"), REQ)}
      ${field("Threat", area("threat", threat, "Threat", "Who or what, doing what"))}
      ${field("ATT&CK techniques", `<div class="v8w-tags">${techs.length ? techs.map((y) => AK.chip(`${y.c} ${y.t}`)).join("") : mu("None yet")}</div>`)}
      ${field("Countering controls", `<div class="v8w-tags">${ctls.slice(0, 8).map((c) => AK.chip(c)).join("")}${ctls.length > 8 ? mu(`+${ctls.length - 8} more`) : ""}${ctls.length ? "" : mu("None in WS-X90's baseline")}</div>`, "", ctls.length ? `In WS-X90's baseline: ${shortOf(ctls).length} of ${ctls.length} short of satisfied` : "")}
      <div class="v8w-two">${field("Likelihood", select("lik", ["Very low", "Low", "Moderate", "High", "Very high"], lik, "Likelihood"))}${field("Impact", select("imp", ["Very low", "Low", "Moderate", "High", "Very high"], imp, "Impact"))}</div>
      ${field("Owner", `<div class="v8w-owner">${AK.owner(null)}<span class="v8w-mu">Assign after it is created</span></div>`)}
      ${err("Give the risk a title.")}`, footer: submitFoot("Create risk", "risk", id || "") };
  };
  M["v8w-scn-new"] = () => ({ title: "Add custom scenario", body: `<p class="ak-desc">A scenario the library lacks, for this workspace. Anyone can start a risk from it.</p>
    ${field("Name", input("name", "", "Name", "For example, Ground station link hijacked"), REQ)}
    <div class="v8w-two">${field("Threat source", input("src", "", "Threat source", "Who or what"))}${field("Event", input("ev", "", "Event", "What happens"))}</div>
    ${field("Predisposing condition", input("pre", "", "Predisposing condition", "What makes it possible on WS-X90"))}
    ${field("ATT&CK techniques", input("tech", "", "ATT&CK techniques", "IDs, for example T0866 T1133"), "", `Any of the ${fmt(TECH.length)} techniques in Appendix F and G`)}
    <div class="v8w-two">${field("Likelihood", select("lik", ["Very low", "Low", "Moderate", "High", "Very high"], "Moderate", "Likelihood"))}${field("Impact", select("imp", ["Very low", "Low", "Moderate", "High", "Very high"], "Moderate", "Impact"))}</div>
    ${err("Give the scenario a name.")}`, footer: submitFoot("Add scenario", "scn") });

  // ═════════════ Wiring: quick views, switches, approvals, dialogs that ask before they close ═════════════
  const refreshPanel = (kind, id, focusSel) => {
    const body = document.querySelector("#panel .pbody"); if (!body || !P[kind]) return;
    const o = P[kind](id); if (!o) return;
    body.innerHTML = o.body;
    const f = focusSel && body.querySelector(focusSel); if (f) { if (!f.matches("button, a, input, select, textarea, [tabindex]")) f.tabIndex = -1; f.focus(); }
  };
  const submit = {
    ticket: (id, dlg) => tkCreate(id, dlg),
    reject: (id, dlg) => {
      const why = dlg.querySelector('[name="reason"]').value.trim(); if (!why) return false;
      const r = RUN[id]; RS[id] = "rejected"; r.why = why;
      toast(`${AG[r.ag].n}'s run rejected: nothing it proposed is applied`);
      setTimeout(() => { redraw(); const pb = document.querySelector("#panel .pbody"); if (pb && pb.querySelector(`[data-v8w-approve-all="${id}"], [data-modal="v8w-reject"][data-id="${id}"]`)) refreshPanel("v8w-run", id); }, 30);
      return true;
    },
    run: (id, dlg) => { const a = dlg.querySelector('[name="agent"]').value, sc = dlg.querySelector('[name="scope"]').value; toast(`${a} started on ${sc.split(" · ")[0]}: its suggestions will wait in Needs approval`); return true; },
    invite: (id, dlg) => {
      const mail = dlg.querySelector('[name="email"]').value.trim(), why = dlg.querySelector('[name="reason"]').value.trim();
      if (!mail || !why) return false;
      const wr = (dlg.querySelector('[name="wr"]:checked') || {}).value || "editor";
      ADDED.unshift({ when: "Just now", day: "2026-11-17", top: true, who: ME, what: [mail, "Not a member", WRN[wr]], scope: "Workspace", why, ex: true });
      toast(`Invitation sent to ${mail} as ${WRN[wr].toLowerCase()}`, "View changes", "permissions-changes");
      setTimeout(redraw, 30); return true;
    },
    role: (n, dlg) => {
      const m = MEMBERS.find((x) => x.n === n), wr = (dlg.querySelector('[name="wr"]:checked') || {}).value, why = dlg.querySelector('[name="reason"]').value.trim();
      if (!m || !why || !wr || wr === m.wr) return false;
      ADDED.unshift({ when: "Just now", day: "2026-11-17", top: true, who: ME, what: [m.n, WRN[m.wr], WRN[wr]], scope: "Workspace", why, ex: true });
      m.wr = wr; m.real = false;
      toast(`${m.n} is now ${WRN[wr].toLowerCase()}: the change and its reason are in Changes`, "View changes", "permissions-changes");
      setTimeout(() => { redraw(); if (document.querySelector("#panel .pbody") && !document.getElementById("panel").hidden && document.querySelector('#panel [data-modal="v8w-role-change"]')) refreshPanel("v8w-member", n); }, 30);
      return true;
    },
    risk: (id, dlg) => {
      const t = dlg.querySelector('[name="title"]').value.trim(); if (!t) return false;
      if (id) USED[id] = (USED[id] || 0) + 1;
      toast(`Risk created on WS-X90's register: ${t.length > 60 ? t.slice(0, 57) + "…" : t}`, "Open Risks", "risks");
      setTimeout(() => { if (route() === "risks-library") redraw(); const pb = document.querySelector("#panel .pbody"); if (pb && id && pb.querySelector(`[data-modal="v8w-risk-new"][data-id="${CSS.escape(id)}"]`)) refreshPanel("v8w-scn", id); }, 30);
      return true;
    },
    scn: (id, dlg) => {
      const v = (n) => dlg.querySelector(`[name="${n}"]`).value.trim(), name = v("name"); if (!name) return false;
      const tech = (v("tech").toUpperCase().match(/T\d{4}/g) || []).filter((c) => TBY[c]);
      CUSTOM.push({ id: "cu" + (CUSTOM.length + 1), custom: true, t: name, src: v("src") || "Not recorded", ev: v("ev") || "Not recorded", pre: v("pre") || "Not recorded", lik: v("lik"), imp: v("imp"), tech, els: [] });
      QV.lib = "ws"; toast(`${name} added to the library`);
      setTimeout(redraw, 30); return true;
    },
  };
  document.addEventListener("click", (e) => {
    const t = e.target.closest ? e.target : null; if (!t) return;
    const sw0 = t.closest("[data-v8w-sw]");
    if (sw0) {
      e.preventDefault(); e.stopPropagation();
      const [k, id] = sw0.dataset.v8wSw.split(":");
      if (k === "agent") { AGON[id] = !AGON[id]; sw0.classList.toggle("on", AGON[id]); sw0.setAttribute("aria-checked", String(AGON[id])); toast(`${AG[id].n} is ${AGON[id] ? "on" : "off"}${AGON[id] ? "" : ": it starts no runs until it is switched back on"}`); }
      return;
    }
    const sub = t.closest("[data-v8w-submit]");
    if (sub) {
      e.preventDefault(); e.stopPropagation();
      const dlg = sub.closest(".dlg"), fn = submit[sub.dataset.v8wSubmit];
      if (!dlg || !fn) return;
      if (fn(sub.dataset.id || "", dlg)) closeModal();
      else { const er = dlg.querySelector(".v8w-err"); if (er) er.hidden = false; const first = [...dlg.querySelectorAll("input[type=text], textarea")].find((x) => !x.value.trim()); if (first) { first.setAttribute("aria-invalid", "true"); first.focus(); } }
      return;
    }
    const q = t.closest("[data-v8w-q]");
    if (q) { QV[q.dataset.v8wQ] = q.dataset.v8wV; redraw(); const again = document.querySelector(`[data-v8w-q="${CSS.escape(q.dataset.v8wQ)}"][data-v8w-v="${CSS.escape(q.dataset.v8wV)}"]`); if (again) again.focus(); return; }
    const more = t.closest("[data-v8w-libmore]");
    if (more) { const k = more.dataset.v8wLibmore, set = new Set((QV["lib-open"] || "").split(",").filter(Boolean)); set.has(k) ? set.delete(k) : set.add(k); QV["lib-open"] = [...set].join(","); redraw(); const again = document.querySelector(`[data-v8w-libmore="${k}"]`); if (again) again.focus(); return; }
    const all = t.closest("[data-v8w-approve-all]");
    if (all) {
      e.stopPropagation();
      const id = all.dataset.v8wApproveAll, r = RUN[id]; if (!r) return;
      r.items.forEach((_, i) => { if (!IS[`${id}-${i}`]) IS[`${id}-${i}`] = "approved"; });
      RS[id] = r.items.some((_, i) => IS[`${id}-${i}`] === "rejected") ? "partly" : "approved";
      toast(`${plural(nItems(r), r.unit.replace(/s$/, ""), r.unit)} approved: ${r.ag === "narr" ? "they become SSP 3 edits under your name" : "they are applied under your name"}`, "Undo");
      redraw(); if (all.closest("#panel")) refreshPanel("v8w-run", id, ".ak-title");
      return;
    }
    const item = t.closest("[data-v8w-item]");
    if (item) {
      e.stopPropagation();
      const [id, i, s] = item.dataset.v8wItem.split("|"), r = RUN[id];
      if (s) IS[`${id}-${i}`] = s; else delete IS[`${id}-${i}`];
      const lab = r.items[+i][0];
      toast(s === "approved" ? `${lab} approved${r.ag === "narr" ? ": it becomes an SSP 3 edit under your name" : ""}` : s === "rejected" ? `${lab} rejected: it stays out of ${r.lands[0].split(" · ")[0]}` : `${lab} waits on you again`);
      refreshPanel("v8w-run", id, `[data-v8w-item^="${id}|${i}|"]`); redraw();
      return;
    }
    const set = t.closest("[data-v8w-set]");
    if (set) { const [k, v] = set.dataset.v8wSet.split(":"); QV[k] = v; if (set.dataset.go === route()) setTimeout(redraw, 0); }
    const op = t.closest("[data-v8w-open]");
    if (op) { e.preventDefault(); e.stopPropagation(); const [r, panel, id] = op.dataset.v8wOpen.split("|"); doOpen({ go: r, panel, id }); return; }
    const ts = t.closest("[data-v8w-toast]");
    if (ts) toast(ts.dataset.v8wToast);
  }, true);
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target; if (!t || !t.matches) return;
    if (t.matches("[data-v8w-open], span[data-v8w-toast]")) { e.preventDefault(); e.stopPropagation(); t.click(); return; }
    if (t.matches("#panel .v8w-pan [data-panel]:not(button), #panel .v8w-pan [data-go]:not(button)")) { e.preventDefault(); e.stopPropagation(); t.click(); }
  }, true);

  // Routes this module draws, their navigation items, and the Jira integration that reads as connected.
  PA.own(["ai-drafts", "ai-drafts-runs", "ai-drafts-agents", "permissions", "permissions-matrix", "permissions-members", "permissions-changes", "risks-library"]);
  ["ai-drafts-runs", "ai-drafts-agents"].forEach((r) => { ROUTE_NAV[r] = "ai-drafts"; });
  ["permissions-matrix", "permissions-members", "permissions-changes"].forEach((r) => { ROUTE_NAV[r] = "permissions"; });
  ROUTE_NAV["risks-library"] = "risks";
  const JIRA = (html) => html.replace(/(<span class="btn sm ink"[^>]*>)Connect(<\/span>)/, `$1Manage connection$2`).replace(/<p class="a-docs-use">(<span>Connected[^<]*<\/span>)<\/p>/, `<p class="a-docs-use v8w-on">${gl("check")}$1</p>`);
  PA.decoratePanel("a-docs-int", (html, id) => (String(id).split("|")[0] === "jira" ? JIRA(html) : html));
  PA.decorate("integration-jira", JIRA);
  PA.decorate("integrations", (html) => html.replace(/<p class="a-docs-use">(<span>Connected · WSX[^<]*<\/span>)<\/p>/, `<p class="a-docs-use v8w-on">${gl("check")}$1</p>`));
  // The canon layer wraps a decorated screen in a new function and drops its __from mark, so the audit would read these after
  // screens as old ones. Once canon has run, put the mark back on the screens this module decorates.
  const MINE = [/^risks(-|$)/, /^check-(scan|iava|stig|sbom|expiring|poam-review|priv-review)(-tasks)?$/, /^my-work(-mine)?$/, /^integrations$/, /^integration-jira$/];
  setTimeout(() => {
    const C = PA.canon && PA.canon.CANON; if (!C) return;
    for (const [r, [c]] of Object.entries(C)) if (S[c] && !S[c].__from && !PA.OWNED.has(c) && MINE.some((m) => m.test(c))) S[c].__from = r;
  }, 0);
})();

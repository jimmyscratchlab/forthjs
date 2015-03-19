/*     Forth.js by Charlie Sung ( jimmyscratchlab@gmail.com )

    Forth.js is a fork of JeForth.
    Jeforth initial version http://www.jeforth.com by FigTaiwan yapcheahshen@gmail.com & samsuanchen@gmail.com

    Forth.js is licensed under the BSD License, see LICENSE.
    For a list of copyright holders, please refer to AUTHORS.
    http://www.jeforth.com
    http://jimmyscratchlab.blogspot.tw/
*/window.Forth || (window.Forth = function() {
    "uses strict";
    function ForthVM(dictsize) {
        function ticktype1(e) {
            logmsg += e;
        }
        function saylogmsg() {
            return logmsg;
        }
        function clearlogmsg() {
            logmsg = "";
        }
        function systemtype(e) {
            ticktype1 && ticktype1(e);
        }
        function redtype(e) {
            systemtype('<font color="red">' + e + "</font>");
        }
        function bluetype(e) {
            systemtype('<font color="blue">' + e + "</font>");
        }
        function greentype(e) {
            systemtype('<font color="green">' + e + "</font>");
        }
        function pinktype(e) {
            systemtype('<font color="purple">' + e + "</font>");
        }
        function cr() {
            systemtype("<br>");
        }
        function reset() {
            highLevelLooping = !1, stack = [], rstack = [], compiling = !1;
        }
        function insertstring(e, t, n, r) {
            var i = e.substring(0, n), s = e.substring(r ? r : n);
            return i + t + s;
        }
        function panic(e) {
            var t = "";
            compiling && (t += "while compiling " + newname + "\n");
            var n = '<font color="red">' + token + "</font>";
            t += e + "\nstop at tib char position " + ntib + "<br>[Buffer Content->]" + insertstring(tib, n, ntib - token.length, ntib), pinktype(t), reset(), error = {
                start: ntib - token.length,
                end: ntib
            };
        }
        function isWhiteSpace(e) {
            return e === " " || e === "    ";
        }
        function isNotWhiteSpaces(e) {
            return e != " " && e != "    ";
        }
        function ignoreWhiteSpaces() {
            while (ntib < tib.length) {
                var e = tib.charAt(ntib);
                if (isNotWhiteSpaces(e)) break;
                ntib++;
            }
        }
        function nextChar() {
            ignoreWhiteSpaces();
            var e = "";
            return ntib < tib.length && (e = tib.charAt(ntib)), e;
        }
        function getquote(e) {
            token = e;
            var t = tib.charAt(ntib++);
            while (ntib < tib.length && t != e) token += t, t = tib.charAt(ntib++);
            return token += e, token;
        }
        function nexttoken(e) {
            e = e || " ";
            var t = tib.length;
            if (ntib === t) return token = "";
            if (e === " ") {
                ignoreWhiteSpaces();
                if (ntib === t) return token = "";
                if (tib.charAt(ntib) === "\n") return ntib++, token = "";
                var n = nextChar();
                if (n === "") return token = "";
                ntib++;
                if (isWhiteSpace(tib.charAt(ntib)) && n === "'") return n;
                if (n === '"' || n === "'") token = getquote(n); else {
                    token = n;
                    do {
                        n = "", ntib < t && (n = tib.charAt(ntib));
                        if (n === "" || isWhiteSpace(n) || n == "\n") break;
                        token += n, ntib++;
                    } while (ntib < t);
                }
            } else {
                token = "";
                var r = [ e ];
                do {
                    var i = r.pop();
                    while (ntib < t && (n = tib.charAt(ntib++)) != i) {
                        token += n;
                        if (n === "(") r.push(i), i = ")"; else if (n === "[") r.push(i), i = "]"; else if (n === "{") r.push(i), i = "}"; else if (n === '"' | n === "'") {
                            var s = n;
                            do token += n = tib.charAt(ntib++); while (n != s);
                        }
                    }
                    ntib < t && r.length > 0 && (token += n);
                } while (n === i && r.length > 0);
            }
            return token;
        }
        function dictcompile(e) {
            dictionary[here++] = e;
        }
        function findword(e) {
            return words[e];
        }
        function tickword(e) {
            e = e || nexttoken();
            var t = findword(e);
            return t == undefined && panic("? " + e), t;
        }
        function compilecode(e, t) {
            dictcompile(e), t != undefined && dictcompile(t);
        }
        function execute(e) {
            typeof e == "function" ? e() : call(e);
        }
        function call(e) {
            highLevelLooping = !0, ip = e;
            do {
                var t = ip, n = dictionary[ip++];
                if (typeof n == "object") {
                    var r = n.lit;
                    stack.push(r);
                    continue;
                }
                var i = words[n];
                if (t["localsFrameBase"] != undefined) {
                    rstack.push(t), highLevelLooping = !1;
                    break;
                }
                var s = i.xa;
                typeof s == "function" ? s() : ((typeof dictionary[ip] == "object" || words[dictionary[ip]].xt != "exit") && rstack.push(ip), ip = s);
            } while (highLevelLooping);
        }
        function ret() {
            clearLocals(), (ip = rstack.pop()) || (highLevelLooping = !1);
        }
        function exec(e) {
            compiling = !1;
            try {
                error = 0, tib = e, ntib = 0;
                do {
                    token = nexttoken();
                    var t = findword(token);
                    if (token == "") continue;
                    if (t == undefined && compiling) {
                        var n = localnames.indexOf(token);
                        if (n != -1) {
                            compilecode("local" + n);
                            continue;
                        }
                    }
                    if (t != undefined) {
                        var r = t;
                        if (compiling) r.immediate ? execute(r.xa) : token != "" && compilecode(r.xt); else {
                            if (r.compileonly) {
                                panic("? compileonly " + token);
                                return;
                            }
                            execute(r.xa);
                        }
                    } else {
                        var i = parseInt(token, base), s = parseFloat(token), o = token.charAt(0);
                        o === "$" && ((i = parseInt(token.substr(1, token.length - 1), 16)) >= 0 || i < 0) ? i = i : o === "#" && parseInt(token.substr(1, token.length - 1), 16) > 0 ? i = token : o !== '"' && o !== "'" || token.charAt(token.length - 1) !== o ? token != i.toString(base) && (i = s) : i = token.substr(1, token.length - 2);
                        if (!(typeof i == "string" || i <= 0 || i > 0)) {
                            panic(" ? ");
                            break;
                        }
                        compiling ? compilecode({
                            lit: i
                        }) : stack.push(i);
                    }
                } while (error === 0 && ntib < tib.length);
            } catch (u) {
                panic(token + " ? Javascript exception!!!" + "Stoped at tib char position " + ntib + '"<br>? ' + u);
            }
        }
        function pSee(e) {
            e = e || stack.pop();
            if (e == undefined) return;
            var t = words[e], n = t.xa;
            systemtype("<br>Scanning " + e), (t.immediate || t.compileonly) && systemtype("<br>"), t.immediate && systemtype("immediate "), t.compileonly && systemtype("compileonly ");
            if (typeof n == "function") systemtype("<br>" + n); else {
                var r = n;
                do {
                    var i = dictionary[r], s = r;
                    i["lit"] != undefined && (i = "{lit:" + i.lit + "}"), systemtype("<br>(");
                    for (var o = 0; o < 6 - s.toString().length; o++) systemtype("0");
                    systemtype(r + ") " + i);
                    if (i === "exit") {
                        systemtype("<br>");
                        break;
                    }
                    r++;
                } while (!0);
            }
        }
        function seeDict(e, t) {
            systemtype("<br>******Dictionary start****** ");
            var n = 0;
            do {
                var r = dictionary[n], i = n;
                r["lit"] != undefined && (r = "{lit:" + r.lit + "}"), systemtype("<br>(");
                for (var s = 0; s < 6 - i.toString().length; s++) systemtype("0");
                systemtype(n + ") " + r);
                if (n == here - 1) {
                    systemtype("<br>*****Dictionary end*****<br><br>");
                    break;
                }
                n++;
            } while (!0);
        }
        function exeMethod(e, t) {
            t = t || stack.pop(), e = e || stack.pop();
            var n;
            e.length > 0 && (n = js_nparam[e]), n = n || 0;
            var r = [];
            for (var i = 0; i < n; i++) r[n - i - 1] = stack.pop();
            fn = t[e];
            var s = fn.apply(t, r);
            js_return[e] && stack.push(s);
        }
        function exeFunction() {
            var e, t = [];
            method = stack.pop();
            while ((e = stack.pop()) != "baffle") t.push(e);
            obj = t.pop(), obj[method] === undefined && panic("exe method " + method + " of " + obj.name + " undefined"), fn = obj[method];
            var n = fn.apply(obj, t.reverse());
            stack.push(n);
        }
        function newJsObj() {
            var e, t, n = {};
            while ((t = stack.pop()) != "baffle") (e = stack.pop()) != "baffle" && (n[e] = t);
            stack.push(n);
        }
        function applyByFuncNameAndArgNum(e, t) {
            var n = stack.splice(stack.length - t, t), r = stack.pop();
            f = r[e], f.apply(r, n);
        }
        function setEventHandler(e, t, n) {
            e[n] = function() {
                execute(words[t].xa);
            };
        }
        function cleartimers() {
            for (var e = 0; e < timers.length; e++) clearTimeout(timers[e]);
        }
        function pForget(e) {
            e != undefined && (words[e] != undefined ? typeof words[e].xa == "number" ? delete words[e] : panic("Cannot forget word xt " + e + "<br>It is not a compilation word") : panic("Cannot forget word xt " + e + "<br>It is undefined"));
        }
        function pForgetAll() {
            for (var e in words) typeof words[e].xa == "number" && delete words[e];
        }
        function newObject(e) {
            words[e] = {
                xt: e,
                xa: here
            }, compilecode("doAttr", e), compilecode("exit");
        }
        function preNewObjectByMethodName(e) {
            e.indexOf(".") == -1 && (panic("Please attach the object name"), ret());
            var t = e.split("."), n = t[0];
            n.length == 0 && (panic("Please attach the object name"), ret()), findword(n) == undefined && newObject(n);
        }
        function virtualkeyboard() {
            function h(e) {
                var t = s.selectionStart, n = e.currentTarget;
                s.value = insertstring(s.value, " " + n.id, s.selectionStart), s.selectionEnd = s.selectionStart = t + n.id.length + 1;
            }
            function p(e) {
                var t = e.currentTarget;
                f.deleteCell(1), c = f.insertCell(1);
                var n = document.createElement("button");
                n.innerHTML = " �颪����� ", c.appendChild(n), n.id = " ", n.onclick = h;
                for (var r in words) {
                    var i = words[r], s = i.xt;
                    i.immediate && (s = '<font color="red">' + s + "</font>"), i.compileonly && (s = '<font color="blue">' + s + "</font>");
                    if (i.kind != undefined && i.kind == t.id) {
                        var n = document.createElement("button");
                        n.innerHTML = s, c.appendChild(n), n.setAttribute("style", "font-size: 120%"), n.id = i.xt, n.onclick = h;
                    }
                }
            }
            var e, t = [ "stack", "display", "math", "logic", "compare", "control", "string", "memory", "compile", "canvas", "tag", "newword" ], n = [ "�疯�", "憿舐內", "�詨飛", "�镡摩", "瘥鯒�", "瘚盙��批饿", "摮ⓓ葡", "閮咞图", "蝺刻陌", "蝜芸�", "璅⒢惜", "�啣�" ], r = nexttoken(), i = nexttoken(), s = document.getElementById(i), o = document.getElementById(r), u = document.createElement("table");
            u.border = 3;
            var a = document.createElement("table");
            a.border = 3;
            var f = o.insertRow(0), l = f.insertCell(0);
            l.appendChild(u);
            var c = f.insertCell(1);
            for (var d in t) {
                var v = u.insertRow(d);
                v.setAttribute("style", "width:30%");
                var m = v.insertCell(0);
                m.setAttribute("style", "font-size: 120%"), m.innerHTML = n[d], m.id = t[d], m.onclick = p;
            }
        }
        function pCanvas() {
            var e = stack.pop(), t = findword(e);
            if (t != undefined) {
                var n = dictionary[words[t.xt].xa];
                if (words[n].xt === "doCanvas") return;
            }
            var r = document.getElementById(e);
            words[e] = {
                xt: e,
                xa: here
            }, compilecode("doCanvas", cv = r.getContext("2d")), compilecode("exit");
        }
        function rgb2hexstr(e, t, n) {
            return "#" + Number(16777216 + e * 65536 + t * 256 + n).toString(16).substring(1);
        }
        function loadFileHttp(e, t, n, r) {
            var i;
            window.XMLHttpRequest && (i = new XMLHttpRequest), i == null && alert("Your browser does not support XMLHTTP."), t && (i.onreadystatechange = function() {
                i.readyState == 4 && n(e, i.responseText, r);
            }), i.open("GET", e, t), i.send(null), t || (i.status == 200 || i.status == 0 ? n(e, i.responseText, r) : alert("ERROR!!! " + e + " status: " + i.status + " statusText: " + i.statusText));
        }
        function callback_include(e, t, n) {
            var r = " ( " + e + " content begin ) " + t + " ( " + e + " content end ) ";
            tib = insertstring(tib, r, ntib);
        }
        function processLocals() {
            var e, t, n = ntib;
            localnames = [];
            if ((e = nexttoken()) == "{") {
                while ((e = nexttoken()) != "}") localnames.push(e);
                compilecode("doLocals", localnames.length), compilecode(0);
            } else ntib = n, compilecode("doLocals", 0), compilecode(0);
        }
        function doLocals() {
            localsFrameBase = rstack.length;
            var e = dictionary[ip++], t = dictionary[ip++];
            rstack.length += e;
            for (var n = 0; n < e; n++) rstack[rstack.length - 1 - n] = stack.pop();
            rstack.length += t;
            for (var n = 0; n < t; n++) rstack[rstack.length - 1 - n] = 0;
            rstack.push({
                localsFrameBase: localsFrameBase
            });
        }
        function clearLocals(e) {
            if (typeof rstack[rstack.length - 1] != "object") return;
            rstack[rstack.length - 1]["localsFrameBase"] != undefined && (localsFrameBase = rstack.pop().localsFrameBase, rstack.length = localsFrameBase, localsFrameBase != 0 && (localsFrameBase = rstack[rstack.length - 2].localsFrameBase));
        }
        const CONST_TWO_PI = Math.PI * 2, CONST_HALF_PI = Math.PI / 2, CONST_THIRD_PI = Math.PI / 3, CONST_QUARTER_PI = Math.PI / 4, CONST_DEG_TO_RAD = Math.PI / 180, CONST_RAD_TO_DEG = 180 / Math.PI;
        var objectMemberNamePool = {}, highLevelLooping = !0;
        dictsize = dictsize || 4095;
        var dictionary = new Array(dictsize + 1), here = 0, ip = 0, stack = [], rstack = [];
        this.stack = function() {
            return stack;
        }, this.getstacklength = function() {
            return stack.length;
        };
        var tib = "", ntib = 0, base = 10, newname, newxa, compiling = !1;
        this.getcompiling = function() {
            return compiling;
        };
        var error = 0;
        this.geterror = function() {
            return error;
        }, this.ticktype = 0;
        var logmsg = "";
        this.saylogmsg = saylogmsg, this.clearlogmsg = clearlogmsg;
        var cv = 0, fence = 0, word, token = "", timers = [], localsFrameBase = 0, localnames = [], words = {
            reset: {
                xt: "reset",
                xa: reset
            },
            ".localsFrameBase": {
                xt: ".localsFrameBase",
                xa: function() {
                    redtype(localsFrameBase);
                },
                compileonly: !0
            },
            doLocals: {
                xt: "doLocals",
                xa: doLocals,
                compileonly: !0
            },
            "var": {
                xt: "var",
                kind: "memory",
                stk: "( &lt;name&gt; -- )",
                hlp: "摰梄儔���蔃���",
                xa: function() {
                    localnames.push(nexttoken());
                },
                immediate: !0,
                compileonly: !0
            },
            local0: {
                xt: "local0",
                xa: function() {
                    stack.push(rstack[localsFrameBase]);
                },
                compileonly: !0
            },
            local1: {
                xt: "local1",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 1]);
                },
                compileonly: !0
            },
            local2: {
                xt: "local2",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 2]);
                },
                compileonly: !0
            },
            local3: {
                xt: "local3",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 3]);
                },
                compileonly: !0
            },
            local4: {
                xt: "local4",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 4]);
                },
                compileonly: !0
            },
            local5: {
                xt: "local5",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 5]);
                },
                compileonly: !0
            },
            local6: {
                xt: "local6",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 6]);
                },
                compileonly: !0
            },
            local7: {
                xt: "local7",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 7]);
                },
                compileonly: !0
            },
            local8: {
                xt: "local8",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 8]);
                },
                compileonly: !0
            },
            local9: {
                xt: "local9",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 9]);
                },
                compileonly: !0
            },
            local10: {
                xt: "local10",
                xa: function() {
                    stack.push(rstack[localsFrameBase + 10]);
                },
                compileonly: !0
            },
            ":": {
                xt: ":",
                kind: "compile",
                stk: "( &lt;name&gt; -- )",
                hlp: "摰梄儔擃哯�閰�",
                xa: function() {
                    newname = nexttoken(), newxa = here, compiling = !0, processLocals();
                }
            },
            exit: {
                xt: "exit",
                kind: "compile",
                stk: "( -- )",
                hlp: "頝喳婵擃哯�閰霶脪銵�",
                xa: ret
            },
            ";": {
                xt: ";",
                kind: "compile",
                stk: "( -- )",
                hlp: "蝯栁�擃哯�閰霶�蝢�",
                xa: function() {
                    compiling = !1, compilecode("exit"), words[newname] = {
                        xt: newname,
                        xa: newxa
                    }, localnames.length > dictionary[newxa + 1] && (dictionary[newxa + 2] = localnames.length - dictionary[newxa + 1]), localnames = [];
                },
                immediate: !0,
                compileonly: !0
            },
            here: {
                xt: "here",
                kind: "compile",
                stk: "( -- addr )",
                hlp: "閰霶积鞈欧�蝛粹��欧�",
                xa: function() {
                    stack.push(here);
                }
            },
            ",": {
                xt: ",",
                kind: "compile",
                stk: "( x -- )",
                hlp: "撠� x 蝺函Ⅳ�啗���",
                xa: function() {
                    dictcompile(stack.pop());
                }
            },
            "[": {
                xt: "[",
                kind: "compile",
                stk: "( -- )",
                hlp: "�脣项�渲陌����",
                xa: function() {
                    compiling = !1;
                },
                immediate: !0
            },
            "]": {
                xt: "]",
                kind: "compile",
                stk: "( -- )",
                hlp: "�脣项蝺刻陌����",
                xa: function() {
                    compiling = !0;
                }
            },
            immediate: {
                xt: "immediate",
                kind: "compile",
                stk: "( -- )",
                hlp: "閮剜閰靁妛蝡鲳仂閰�,蝺刻陌�彁��喳脪銵�",
                xa: function() {
                    words[newname].immediate = !0;
                }
            },
            compileonly: {
                xt: "compileonly",
                kind: "compile",
                stk: "( -- )",
                hlp: "閮剜閰霶�靘ｇ楊霅�",
                xa: function() {
                    words[newname].compileonly = !0;
                }
            },
            "'": {
                xt: "'",
                xa: function() {
                    stack.push(tickword().xt);
                }
            },
            tick: {
                xt: "tick",
                kind: "compile",
                stk: "( &lt;name&gt; -- xt )",
                hlp: "�綨�閰靁�霅咓锑蝣�",
                xa: function() {
                    stack.push(tickword().xt);
                }
            },
            "(')": {
                xt: "(')",
                xa: function() {
                    stack.push(dictionary[ip++]);
                }
            },
            "[']": {
                xt: "[']",
                xa: function() {
                    compilecode("(')", tickword().xt);
                },
                immediate: !0
            },
            doLit: {
                xt: "doLit",
                kind: "compile",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(dictionary[ip++]);
                },
                compileonly: !0
            },
            self: {
                xt: "self",
                kind: "compile",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode(newname);
                },
                compileonly: !0
            },
            selfid: {
                xt: "selfid",
                kind: "compile",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = newname;
                    compiling ? compilecode("(')", e) : stack.push(e);
                },
                immediate: !0,
                compileonly: !0
            },
            postpone: {
                xt: "postpone",
                kind: "compile",
                stk: "( &lt;name&gt; -- xt )",
                hlp: "撘瑁翰蝡鲳仂閰靁楊霅航�摰阵辣�脣脪銵�",
                xa: function() {
                    var e = tickword().xt;
                    compilecode(e);
                },
                immediate: !0,
                compileonly: !0
            },
            findword: {
                xt: "findword",
                xa: function() {
                    var e = findword(nexttoken());
                    e == undefined ? stack.push(-1) : stack.push(e.xt);
                }
            },
            "(": {
                xt: "(",
                xa: function() {
                    nexttoken(")");
                },
                immediate: !0
            },
            "\\": {
                xt: "\\",
                xa: function() {
                    while (ntib < tib.length) {
                        var e = ntib++, t = tib.charAt(e++), n = tib.charAt(e++), r = tib.charAt(e++), i = tib.charAt(e), s = t + n + r + i;
                        if (t == "\n") break;
                        if (s == "<br>") {
                            ntib += 3;
                            break;
                        }
                    }
                },
                immediate: !0
            },
            dup: {
                xt: "dup",
                kind: "stack",
                stk: "( x -- x x )",
                hlp: "銴殴ˊ�疯��彁垢 x",
                xa: function() {
                    stack.push(stack[stack.length - 1]);
                }
            },
            "2dup": {
                xt: "2dup",
                kind: "stack",
                stk: "( x1 x2 -- x1 x2 x1 x2 )",
                hlp: "銴殴ˊ x1 x2",
                xa: function() {
                    stack.push(stack[stack.length - 2]), stack.push(stack[stack.length - 2]);
                }
            },
            drop: {
                xt: "drop",
                kind: "stack",
                stk: "( x -- )",
                hlp: "敺霶 疯�蝘駁妚 x",
                xa: function() {
                    stack.pop();
                }
            },
            "2drop": {
                xt: "2drop",
                kind: "stack",
                stk: "( x1 x2 -- )",
                hlp: "敺霶 疯�銝蓤� x1 x2",
                xa: function() {
                    stack.pop(), stack.pop();
                }
            },
            swap: {
                xt: "swap",
                kind: "stack",
                stk: "( x1 x2 -- x2 x1 )",
                hlp: "鈭斗���銝简�枣饭�鲳 疯��陉�",
                xa: function() {
                    var e = stack.length - 1, t = stack[e];
                    stack[e] = stack[e - 1], stack[e - 1] = t;
                }
            },
            "2swap": {
                xt: "2swap",
                kind: "stack",
                stk: "( x1 x2 x3 x4 -- x3 x4 x1 x2 )",
                hlp: "鈭斗��疯�銝簧硅�枣饭蝯枣腙�阵�",
                xa: function() {
                    var e = stack.length - 1, t = stack[e];
                    stack[e] = stack[e - 2], stack[e - 2] = t, t = stack[e - 1], stack[e - 1] = stack[e - 3], stack[e - 3] = t;
                }
            },
            nip: {
                xt: "nip",
                kind: "stack",
                stk: "( x1 x2 -- x2 )",
                hlp: "銝蓤��疯��彁洵鈭鉴�鲳�蝝 ",
                xa: function() {
                    stack[stack.length - 2] = stack.pop();
                }
            },
            over: {
                xt: "over",
                kind: "stack",
                stk: "( x1 x2 -- x1 x2 x1 )",
                hlp: "銴殴ˊ�疯��彁洵鈭鉴�鲳�蝝ǜ闾�疯���",
                xa: function() {
                    stack.push(stack[stack.length - 2]);
                }
            },
            "2over": {
                xt: "2over",
                kind: "stack",
                stk: "( x1 x2 x3 x4 -- x1 x2 x3 x4 x1 x2 )",
                hlp: "銴殴ˊ�桀�撠� x1 x2 �啣 疯���",
                xa: function() {
                    stack.push(stack[stack.length - 4]), stack.push(stack[stack.length - 4]);
                }
            },
            rot: {
                xt: "rot",
                kind: "stack",
                stk: "( x1 x2 x3 -- x2 x3 x1 )",
                hlp: "�疯��彁洵銝桧�鲳�蝝燗��啣 疯���",
                xa: function() {
                    var e = stack.length - 1, t = stack[e - 2];
                    stack[e - 2] = stack[e - 1], stack[e - 1] = stack[e], stack[e] = t;
                }
            },
            tuck: {
                xt: "tuck",
                kind: "stack",
                stk: "( x1 x2 -- x2 x1 x2 )",
                hlp: "�疯��彁洵銝��鲳 疯��陉�銴殴ˊ�啁洵鈭鉴�鲳 疯��陉�銋鲸�",
                xa: function() {
                    var e = stack.length - 1, t = stack[e];
                    stack[e] = stack[e - 1], stack[e - 1] = t, stack.push(t);
                }
            },
            pick: {
                xt: "pick",
                kind: "stack",
                stk: "( xu ... x1 x0 u -- xu ... x1 x0 xu )",
                hlp: "蝘駁妚 u. 銴殴ˊ xu �啣 疯��栋�銝簧硅",
                xa: function() {
                    var e = stack.length - 1, t = stack[e];
                    stack[e] = stack[e - t - 1];
                }
            },
            roll: {
                xt: "roll",
                kind: "stack",
                stk: "( xu xu-1 ... x0 u -- xu-1 ... x0 xu )",
                hlp: "蝘駁妚 u. 蝚� u+1 �鲳�蝝燗��啣 疯��栋�銝簧硅",
                xa: function() {
                    var e = stack.pop();
                    if (e > 0) {
                        var t = stack.length - 1, n = stack[t - e];
                        for (i = e - 1; i >= 0; i--) stack[t - i - 1] = stack[t - i];
                        stack[t] = n;
                    }
                }
            },
            "r>": {
                xt: "r>",
                kind: "stack",
                stk: "( -- x ) ( R:  x -- )",
                hlp: "撠� x 敺靗��霶 疯��砍闾鞈欧��疯�",
                xa: function() {
                    stack.push(rstack.pop());
                },
                compileonly: !0
            },
            ">r": {
                xt: ">r",
                kind: "stack",
                stk: "( x -- ) ( R:  -- x )",
                hlp: "撠� x �祉宏�啗��霶 疯�",
                xa: function() {
                    rstack.push(stack.pop());
                },
                compileonly: !0
            },
            "r@": {
                xt: "r@",
                kind: "stack",
                stk: "( -- x ) ( R:  x -- x )",
                hlp: "撠� x 敺靗��霶 疯�銴殴ˊ�唾��⒠ 疯�",
                xa: function() {
                    stack.push(rstack[rstack.length - 1]);
                }
            },
            ".s": {
                xt: ".s",
                kind: "display",
                stk: "( -- )",
                hlp: "憿舐內鞈欧��疯�鋆∠���",
                xa: function() {
                    if (stack.length > 0) for (var e in stack) systemtype(stack[e] + " "); else stack = [], systemtype("empty");
                }
            },
            ".s>dlg": {
                xt: ".s>dlg",
                kind: "display",
                stk: "( -- )",
                hlp: "閬緐�憿舐內鞈欧��疯�鋆∠���",
                xa: function() {
                    stack.length > 0 ? alert("[Data stack]\n" + stack) : alert("[Data stack]\nempty");
                }
            },
            ".rs>dlg": {
                xt: ".rs>dlg",
                kind: "display",
                stk: "( -- )",
                hlp: "閬緐�憿舐內餈鮴��疯�鋆∠���",
                xa: function() {
                    rstack.length > 0 ? alert("[Return stack]\n" + rstack) : alert("[Return stack]\nempty");
                }
            },
            ".rs": {
                xt: ".rs",
                kind: "display",
                stk: "( -- )",
                hlp: "憿舐內餈鮴��疯�鋆∠���",
                xa: function() {
                    if (rstack.length > 0) for (var e in rstack) rstack[e]["localsFrameBase"] == undefined ? systemtype(rstack[e] + " ") : systemtype("{localsFrameBase:" + rstack[e].localsFrameBase + "} "); else rstack = [], systemtype("empty");
                }
            },
            ".(": {
                xt: ".(",
                kind: "display",
                stk: "( <str> -- )",
                hlp: "�啣婵�祈��緑�摮ⓓ葡,蝡鲳仂閰�",
                xa: function() {
                    systemtype(nexttoken(")"));
                },
                immediate: !0
            },
            '(.")': {
                xt: '(.")',
                xa: function() {
                    systemtype(dictionary[ip++]);
                },
                compileonly: !0
            },
            '."': {
                xt: '."',
                kind: "display",
                stk: "( <str> -- )",
                hlp: "�啣婵撘厠��緑�摮ⓓ葡,蝺刻陌��",
                xa: function() {
                    compilecode('(.")', nexttoken('"'));
                },
                immediate: !0,
                compileonly: !0
            },
            ".": {
                xt: ".",
                kind: "display",
                stk: "( n -- )",
                hlp: "靘� base �啣婵�詨�� n",
                xa: function() {
                    systemtype(stack.pop().toString(base) + " ");
                }
            },
            hex: {
                xt: "hex",
                kind: "display",
                stk: "( -- )",
                hlp: "閮剖��詨�潔誑�癴冯�脣饿�啣婵",
                xa: function() {
                    base = 16;
                }
            },
            decimal: {
                xt: "decimal",
                kind: "display",
                stk: "( -- )",
                hlp: "閮剖��詨�潔誑�眏�脣饿�啣婵",
                xa: function() {
                    base = 10;
                }
            },
            "base@": {
                xt: "base@",
                kind: "display",
                stk: "( -- n )",
                hlp: "�綨��脣饿�� n",
                xa: function() {
                    stack.push(base);
                }
            },
            "base!": {
                xt: "base!",
                kind: "display",
                stk: "( n -- )",
                hlp: "閮剖� n �粹�脣饿��",
                xa: function() {
                    base = stack.pop();
                }
            },
            cr: {
                xt: "cr",
                kind: "display",
                stk: "( -- )",
                hlp: "�唬�銝��ⓖ匱蝥繮撓��",
                xa: cr
            },
            ".r": {
                xt: ".r",
                kind: "display",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t = t.toString(base), e -= t.length;
                    if (e > 0) do t = "0" + t; while (--e > 0);
                    systemtype(t);
                }
            },
            space: {
                xt: "space",
                kind: "display",
                stk: "",
                hlp: "",
                xa: function() {
                    systemtype("&nbsp;");
                }
            },
            "+": {
                xt: "+",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() + e);
                }
            },
            "1+": {
                xt: "1+",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() + 1);
                }
            },
            "2+": {
                xt: "2+",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() + 2);
                }
            },
            "-": {
                xt: "-",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() - e);
                }
            },
            "1-": {
                xt: "1-",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() - 1);
                }
            },
            "2-": {
                xt: "2-",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() - 2);
                }
            },
            "*": {
                xt: "*",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() * stack.pop());
                }
            },
            "2*": {
                xt: "2*",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() * 2);
                }
            },
            "/": {
                xt: "/",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() / e);
                }
            },
            "2/": {
                xt: "2/",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(stack.pop() / 2);
                }
            },
            mod: {
                xt: "mod",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() % e);
                }
            },
            "/mod": {
                xt: "/mod",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.length - 1, t = stack[e - 1], n = stack[e], r = Math.floor(t / n);
                    stack[e - 1] -= n * r, stack[e] = r;
                }
            },
            div: {
                xt: "div",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    stack.push((t - t % e) / e);
                }
            },
            negate: {
                xt: "negate",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(-stack.pop());
                }
            },
            abs: {
                xt: "abs",
                kind: "math",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(Math.abs(stack.pop()));
                }
            },
            bl: {
                xt: "bl",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(" ");
                }
            },
            'c"': {
                xt: 'c"',
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken('"').slice(1);
                    compiling ? compilecode("doLit", e) : stack.push(e);
                },
                immediate: !0
            },
            's"': {
                xt: 's"',
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken('"').slice(1);
                    compiling ? (compilecode("doLit", e), compilecode("doLit", e.length)) : (stack.push(e), stack.push(e.length));
                },
                immediate: !0
            },
            obj2str: {
                xt: "obj2str",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 1] = JSON.stringify(stack[stack.length - 1]);
                }
            },
            strlen: {
                xt: "strlen",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack[stack.length - 1];
                    stack[stack.length - 1] = e.length;
                }
            },
            substr: {
                xt: "substr",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack[stack.length - 1];
                    stack[stack.length - 1] = n.substr(t, e);
                }
            },
            substring: {
                xt: "substring",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack[stack.length - 1];
                    stack[stack.length - 1] = n.substring(e, t);
                }
            },
            "#substrs": {
                xt: "#substrs",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack[stack.length - 1], n = t.split(" ");
                    stack[stack.length - 1] = n.length;
                }
            },
            strconcat: {
                xt: "strconcat",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    stack.push(t.concat(e));
                }
            },
            type: {
                xt: "type",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    systemtype(stack.pop());
                }
            },
            count: {
                xt: "count",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    stack.push(e.slice()), stack.push(e.length);
                }
            },
            compare: {
                xt: "compare",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = 0, s = n < e ? n : e;
                    for (var o = 0; o < s; o++) {
                        var u = t.charCodeAt(o) - r.charCodeAt(o);
                        if (u != 0) {
                            i = u > 0 ? -1 : 1, stack.push(i);
                            return;
                        }
                    }
                    n < e ? i = -1 : n > e && (i = 1), stack.push(i);
                }
            },
            word: {
                xt: "word",
                kind: "string",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack[stack.length - 1], t = nexttoken(e);
                    stack[stack.length - 1] = t;
                }
            },
            "true": {
                xt: "true",
                kind: "compare",
                stk: "( -- true )",
                hlp: "�喳��蓢��",
                xa: function() {
                    stack.push(!0);
                }
            },
            "false": {
                xt: "false",
                kind: "compare",
                stk: "( -- false )",
                hlp: "�喳��枞��",
                xa: function() {
                    stack.push(!1);
                }
            },
            "0=": {
                xt: "0=",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳蝑栉蒽 0",
                xa: function() {
                    stack.push(stack.pop() === 0);
                }
            },
            "0<": {
                xt: "0<",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳撠镦蒽 0",
                xa: function() {
                    stack.push(stack.pop() < 0);
                }
            },
            "0>": {
                xt: "0>",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳憭扳蒽 0",
                xa: function() {
                    stack.push(stack.pop() > 0);
                }
            },
            "0<>": {
                xt: "0<>",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳銝讵��� 0",
                xa: function() {
                    stack.push(stack.pop() !== 0);
                }
            },
            "0<=": {
                xt: "0<=",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳撠镦蒽蝑栉蒽 0 ",
                xa: function() {
                    stack.push(stack.pop() <= 0);
                }
            },
            "0>=": {
                xt: "0>=",
                kind: "compare",
                stk: "( x -- flag )",
                hlp: "瘥鯒� x �臬谳憭扳蒽蝑栉蒽 0",
                xa: function() {
                    stack.push(stack.pop() >= 0);
                }
            },
            "==": {
                xt: "==",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳�潸��鲭��函��� x2",
                xa: function() {
                    stack.push(stack.pop() === stack.pop());
                }
            },
            ">": {
                xt: ">",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳憭扳蒽 x2",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() > e);
                }
            },
            "<": {
                xt: "<",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳撠镦蒽 x2 ",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() < e);
                }
            },
            "<>": {
                xt: "<>",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳銝讵��� x2",
                xa: function() {
                    stack.push(stack.pop() !== stack.pop());
                }
            },
            ">=": {
                xt: ">=",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳憭扳蒽蝑栉蒽 x2",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() >= e);
                }
            },
            "<=": {
                xt: "<=",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �臬谳撠镦蒽蝑栉蒽 x2",
                xa: function() {
                    var e = stack.pop();
                    stack.push(stack.pop() <= e);
                }
            },
            "=": {
                xt: "=",
                kind: "compare",
                stk: "( x1 x2 -- flag )",
                hlp: "瘥鯒� x1 �� x2 �拇㕑�臬谳�貊� ",
                xa: function() {
                    stack.push(stack.pop() == stack.pop());
                }
            },
            "&&": {
                xt: "&&",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    stack.push(t && e);
                }
            },
            "||": {
                xt: "||",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    stack.push(t || e);
                }
            },
            "!!": {
                xt: "!!",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(!stack.pop());
                }
            },
            and: {
                xt: "and",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] &= stack.pop();
                }
            },
            or: {
                xt: "or",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] |= stack.pop();
                }
            },
            xor: {
                xt: "xor",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] ^= stack.pop();
                }
            },
            not: {
                xt: "not",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(~stack.pop());
                }
            },
            lshift: {
                xt: "lshift",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] <<= stack.pop();
                }
            },
            urshift: {
                xt: "urshift",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] >>>= stack.pop();
                }
            },
            rshift: {
                xt: "rshift",
                kind: "logic",
                stk: "",
                hlp: "",
                xa: function() {
                    stack[stack.length - 2] >>= stack.pop();
                }
            },
            branch: {
                xt: "branch",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    ip = dictionary[ip];
                },
                compileonly: !0
            },
            "0branch": {
                xt: "0branch",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.pop() ? ip++ : ip = dictionary[ip];
                },
                compileonly: !0
            },
            "if": {
                xt: "if",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode("0branch", 0), stack.push({
                        tkn: "if",
                        at: here - 1
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            "else": {
                xt: "else",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode("branch", 0);
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "if") {
                        panic("else 銋鲳��殓� if �菝�");
                        return;
                    }
                    dictionary[e.at] = here, stack.push({
                        tkn: "else",
                        at: here - 1
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            then: {
                xt: "then",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "if" && e.tkn != "else") {
                        panic("then 銋鲳��殓� if �� else �菝�");
                        return;
                    }
                    dictionary[e.at] = here;
                },
                immediate: !0,
                compileonly: !0
            },
            begin: {
                xt: "begin",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push({
                        tkn: "begin",
                        at: here
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            again: {
                xt: "again",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "begin") {
                        panic("again 銋鲳��殓� begin �菝�");
                        return;
                    }
                    compilecode("branch", e.at);
                },
                immediate: !0,
                compileonly: !0
            },
            until: {
                xt: "until",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "begin") {
                        panic("until 銋鲳��殓� begin �菝�");
                        return;
                    }
                    compilecode("0branch", e.at);
                },
                immediate: !0,
                compileonly: !0
            },
            "while": {
                xt: "while",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack[stack.length - 1];
                    if (typeof e != "object" || e.tkn != "begin") {
                        panic("while 銋鲳��殓� begin �菝�");
                        return;
                    }
                    compilecode("0branch", 0), stack.push({
                        tkn: "while",
                        at: here - 1
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            repeat: {
                xt: "repeat",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "while") {
                        panic("repeat 銋鲳��殓� while �菝�");
                        return;
                    }
                    var t = e.at;
                    compilecode("branch", stack.pop().at), dictionary[t] = here;
                },
                immediate: !0,
                compileonly: !0
            },
            "for": {
                xt: "for",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode(">r"), stack.push({
                        tkn: "for",
                        at: here
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            doNext: {
                xt: "doNext",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = rstack.pop() - 1;
                    e <= 0 ? ip++ : (ip = dictionary[ip], rstack.push(e));
                },
                compileonly: !0
            },
            next: {
                xt: "next",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "for") {
                        panic("next 銋鲳��殓� for �菝�");
                        return;
                    }
                    compilecode("doNext", e.at);
                },
                immediate: !0,
                compileonly: !0
            },
            "(do)": {
                xt: "(do)",
                xa: function() {
                    var e = stack.pop();
                    rstack.push(dictionary[ip++]), rstack.push(stack.pop()), rstack.push(e);
                },
                compileonly: !0
            },
            "do": {
                xt: "do",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode("(do)", 0), stack.push({
                        tkn: "do",
                        at: here - 1
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            "(?do)": {
                xt: "(?do)",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t === e ? ip = dictionary[ip] : (rstack.push(dictionary[ip++]), rstack.push(t), rstack.push(e));
                },
                compileonly: !0
            },
            "?do": {
                xt: "?do",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode("(?do)", 0), stack.push({
                        tkn: "?do",
                        at: here - 1
                    });
                },
                immediate: !0,
                compileonly: !0
            },
            "(loop)": {
                xt: "(loop)",
                xa: function() {
                    var e = rstack.pop();
                    ++e < rstack[rstack.length - 1] ? (rstack.push(e), ip = dictionary[ip]) : (rstack.pop(), rstack.pop(), ip++);
                },
                compileonly: !0
            },
            loop: {
                xt: "loop",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "do" && e.tkn != "?do") {
                        panic("loop 銋鲳��殓� do �� ?do �菝�");
                        return;
                    }
                    var t = e.at;
                    compilecode("(loop)", t + 1), dictionary[t] = here;
                },
                immediate: !0,
                compileonly: !0
            },
            "(+loop)": {
                xt: "(+loop)",
                xa: function() {
                    var e = stack.pop(), t = e + rstack.pop(), n = rstack[rstack.length - 1], r = e > 0 ? t < n : t >= n;
                    r ? (rstack.push(t), ip = dictionary[ip]) : (rstack.pop(), rstack.pop(), ip++);
                },
                compileonly: !0
            },
            "+loop": {
                xt: "+loop",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e != "object" || e.tkn != "do" && e.tkn != "?do") {
                        panic("+loop 銋鲳��殓� do �� ?do �菝�");
                        return;
                    }
                    var t = e.at;
                    compilecode("(+loop)", t + 1), dictionary[t] = here;
                },
                immediate: !0,
                compileonly: !0
            },
            leave: {
                xt: "leave",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    rstack.pop(), rstack.pop(), ip = rstack.pop();
                },
                compileonly: !0
            },
            "?leave": {
                xt: "?leave",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.pop() && (rstack.pop(), rstack.pop(), ip = rstack.pop());
                },
                compileonly: !0
            },
            i: {
                xt: "i",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(rstack[rstack.length - 1]);
                },
                compileonly: !0
            },
            j: {
                xt: "j",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(rstack[rstack.length - 4]);
                },
                compileonly: !0
            },
            k: {
                xt: "k",
                kind: "control",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(rstack[rstack.length - 7]);
                },
                compileonly: !0
            },
            doCon: {
                xt: "doCon",
                xa: function() {
                    stack.push(dictionary[ip]), ret();
                },
                compileonly: !0
            },
            constant: {
                xt: "constant",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    newname = nexttoken(), words[newname] = {
                        xt: newname,
                        xa: here
                    }, compilecode("doCon", stack.pop());
                }
            },
            doVar: {
                xt: "doVar",
                xa: function() {
                    stack.push(ip), ret();
                },
                compileonly: !0
            },
            variable: {
                xt: "variable",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    newname = nexttoken(), words[newname] = {
                        xt: newname,
                        xa: here
                    }, compilecode("doVar", 0);
                }
            },
            create: {
                xt: "create",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    newname = nexttoken(), newxa = here, words[newname] = {
                        xt: newname,
                        xa: here
                    }, compilecode("doVar");
                }
            },
            allot: {
                xt: "allot",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = here;
                    here += stack.pop();
                    for (var t = e; t < here; t++) dictionary[t] = 0;
                }
            },
            "@": {
                xt: "@",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(dictionary[stack.pop()]);
                }
            },
            "?": {
                xt: "?",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    systemtype(dictionary[stack.pop()]);
                }
            },
            "!": {
                xt: "!",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    dictionary[stack.pop()] = stack.pop();
                }
            },
            "+!": {
                xt: "+!",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    dictionary[stack.pop()] += stack.pop();
                }
            },
            doDoes: {
                xt: "doDoes",
                xa: function() {
                    var e = dictionary[ip++];
                    rstack.push(ip), ip = e;
                },
                compileonly: !0
            },
            does: {
                xt: "does",
                xa: function() {
                    dictionary[newxa] = findword("doDoes").xt;
                    for (var e = here++; e > newxa; e--) dictionary[e + 1] = dictionary[e];
                    dictionary[e + 1] = ip, ret();
                },
                compileonly: !0
            },
            "does>": {
                xt: "does>",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    compilecode("does"), compilecode("r>");
                },
                immediate: !0,
                compileonly: !0
            },
            doValue: {
                xt: "doValue",
                xa: function() {
                    stack.push(dictionary[ip]), ret();
                },
                compileonly: !0
            },
            value: {
                xt: "value",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken();
                    words[e] = {
                        xt: e,
                        xa: here
                    }, compilecode("doValue", stack.pop());
                }
            },
            "(tolocal)": {
                xt: "(tolocal)",
                xa: function() {
                    var e = dictionary[ip++];
                    rstack[localsFrameBase + e] = stack.pop();
                },
                compileonly: !0
            },
            "(to)": {
                xt: "(to)",
                xa: function() {
                    var e = dictionary[ip++], t = words[e].xa;
                    dictionary[++t] = stack.pop();
                },
                compileonly: !0
            },
            to: {
                xt: "to",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = ntib, t = nexttoken();
                    if (compiling) {
                        var n = localnames.indexOf(t);
                        if (n != -1) {
                            compilecode("(tolocal)", n);
                            return;
                        }
                    }
                    ntib = e;
                    var r = tickword().xt, i = words[r].xa, s = words[dictionary[i]].xt;
                    s != "doValue" && panic("cannot store to " + words[r].xt), compiling ? compilecode("(to)", r) : dictionary[++i] = stack.pop();
                },
                immediate: !0
            },
            "(+to)": {
                xt: "(+to)",
                xa: function() {
                    var e = dictionary[ip++], t = words[e].xa;
                    dictionary[++t] += stack.pop();
                },
                compileonly: !0
            },
            "+to": {
                xt: "+to",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = tickword().xt, t = words[e].xa, n = words[dictionary[t]].xt;
                    n != "doValue" && panic("cannot store to " + words[e].xt), compiling ? compilecode("(+to)", e) : dictionary[++t] += stack.pop();
                },
                immediate: !0
            },
            "state@": {
                xt: "state@",
                kind: "memory",
                stk: "",
                hlp: "",
                xa: function() {
                    stack.push(compiling);
                }
            },
            doInstanceAllAttr: {
                xt: "doInstanceAllAttr",
                xa: function() {
                    var e, t = stack.pop();
                    while ((e = dictionary[ip++]) != "exit") newname = t + "." + e, words[newname] = {
                        xt: newname,
                        xa: here
                    }, compilecode("doValue", 0), compilecode("exit");
                    ret();
                },
                compileonly: !0
            },
            "class": {
                xt: "class",
                xa: function() {
                    token = nexttoken();
                    var e = token;
                    words[e] = {
                        xt: e,
                        xa: here
                    }, compilecode("doInstanceAllAttr");
                    while (nexttoken() != "end_class") {
                        var t = token;
                        compilecode(t);
                    }
                    compilecode("exit");
                }
            },
            instance: {
                xt: "instance",
                xa: function() {
                    token = nexttoken();
                    var e = token;
                    objname = nexttoken(), newObject(objname), stack.push(objname), execute(findword(e).xa);
                }
            },
            doAttr: {
                xt: "doAttr",
                xa: function() {
                    var e = dictionary[ip];
                    newname = e + "." + nexttoken(), words[newname] = {
                        xt: newname,
                        xa: here
                    }, compilecode("doValue", stack.pop()), compilecode("exit"), ret();
                },
                compileonly: !0
            },
            "new": {
                xt: "new",
                xa: function() {
                    newname = nexttoken(), newObject(newname);
                }
            },
            assign: {
                xt: "assign",
                xa: function() {
                    var e = nexttoken(), t = findword(e).xt;
                    newname = nexttoken(), preNewObjectByMethodName(newname), words[newname] = {
                        xt: newname,
                        xa: words[t].xa
                    }, words[t].compileonly && (words[newname].compileonly = !0), words[t].immediate && (words[newname].immediate = !0);
                }
            },
            ":method": {
                xt: ":method",
                xa: function() {
                    newname = nexttoken(), preNewObjectByMethodName(newname), newxa = here, compiling = !0;
                }
            },
            execute: {
                xt: "execute",
                xa: function() {
                    execute(words[stack.pop()].xa);
                }
            },
            words: {
                xt: "words",
                xa: function() {
                    for (var e in words) {
                        var t = words[e], n = t.xt;
                        t.immediate && (n = '<font color="red">' + n + "</font>"), t.compileonly && (n = '<font color="blue">' + n + "</font>"), systemtype("<b> " + n + " </b>");
                    }
                }
            },
            help: {
                xt: "help",
                xa: function() {
                    systemtype("<br>Forth Words隤芣�<br>鞈欧��鲳锑: flag �蓢��潭�璅�, n �殓���, +n 甇敍��, u �∟���, x �芣�摰梄��桀�, char 摮ⓔ�, str 摮ⓓ葡, xt �瑁�霅咓锑蝣�, addr 雿菝� <br>");
                    var e = nexttoken();
                    if (e == "-all") for (var t in words) {
                        var n = words[t], r = n.xt;
                        n.immediate && (r = '<font color="red">' + r + "</font>"), n.compileonly && (r = '<font color="blue">' + r + "</font>"), n.stk != undefined && systemtype("<br><b> " + r + "&nbsp;&nbsp;&nbsp; </b>" + n.stk + "&nbsp;&nbsp;" + n.hlp);
                    }
                }
            },
            "(see)": {
                xt: "(see)",
                xa: pSee
            },
            see: {
                xt: "see",
                xa: function() {
                    pSee(tickword().xt);
                }
            },
            dict: {
                xt: "dict",
                xa: function() {
                    seeDict();
                }
            },
            "(forget)": {
                xt: "(forget)",
                xa: function() {
                    pForget(stack.pop());
                }
            },
            forget: {
                xt: "forget",
                xa: function() {
                    pForget(tickword().xt);
                }
            },
            reboot: {
                xt: "reboot",
                xa: function() {
                    reset(), cleartimers(), pForgetAll(), dictionary = new Array(dictsize + 1), here = 0, exec(preLoadHiWords);
                }
            },
            today: {
                xt: "today",
                xa: function() {
                    var e = new Date;
                    stack.push(e.getFullYear()), stack.push(e.getMonth()), stack.push(e.getDate());
                }
            },
            now: {
                xt: "now",
                xa: function() {
                    var e = new Date;
                    stack.push(e.getHours()), stack.push(e.getMinutes()), stack.push(e.getSeconds());
                }
            },
            msec: {
                xt: "msec",
                xa: function() {
                    var e = new Date;
                    stack.push(e.getTime());
                }
            },
            ">name": {
                xt: ">name",
                xa: function() {
                    var e = stack.pop(), t = words[e].xt;
                    stack.push(t);
                }
            },
            ">code": {
                xt: ">code",
                xa: function() {
                    var e = words[stack.pop()].xa;
                    typeof e == "function" ? stack.push(e) : stack.push("NaF");
                }
            },
            ">body": {
                xt: ">body",
                xa: function() {
                    var e = words[stack.pop()].xa;
                    typeof e == "number" ? stack.push(e + 1) : stack.push("NaN");
                }
            },
            ">in": {
                xt: ">in",
                xa: function() {
                    stack.push(tib);
                }
            },
            ">in@": {
                xt: ">in@",
                xa: function() {
                    stack.push(ntib);
                }
            },
            ">in!": {
                xt: ">in!",
                xa: function() {
                    ntib = stack.pop();
                }
            },
            alias: {
                xt: "alias",
                xa: function() {
                    while (nexttoken() != "end_alias") {
                        var e = findword(token).xt;
                        newname = nexttoken(), words[newname] = {
                            xt: newname,
                            xa: words[e].xa,
                            kind: words[e].kind
                        }, words[e].compileonly && (words[newname].compileonly = !0), words[e].immediate && (words[newname].immediate = !0);
                    }
                }
            },
            code: {
                xt: "code",
                xa: function() {
                    var n = nexttoken();
                    ignoreWhiteSpaces();
                    var c = tib.charAt(ntib) === "{" ? "}" : ";";
                    c === "}" && ntib++, c = nexttoken(c), c = 'words["' + n + '"]={xt:"' + n + '",xa:function() {' + c + "}}", eval(c);
                }
            },
            "[defined]": {
                xt: "[defined]",
                xa: function() {
                    findword(nexttoken()) != undefined ? stack.push(!0) : stack.push(!1);
                },
                immediate: !0
            },
            "[undefined]": {
                xt: "[undefined]",
                xa: function() {
                    findword(nexttoken()) != undefined ? stack.push(!1) : stack.push(!0);
                },
                immediate: !0
            },
            "[if]": {
                xt: "[if]",
                xa: function() {
                    stack.pop() == 0 && execute(words[findword("[else]")].xa);
                },
                immediate: !0
            },
            "[else]": {
                xt: "[else]",
                xa: function() {
                    var e, t = 0;
                    while ((e = nexttoken()) != "") {
                        e === "[if]" && t++;
                        if (e === "[else]" || e === "[then]") {
                            if (t == 0) break;
                            e === "[then]" && t--;
                        }
                    }
                },
                immediate: !0
            },
            "[then]": {
                xt: "[then]",
                xa: function() {},
                immediate: !0
            },
            '(abort")': {
                xt: '(abort")',
                xa: function() {
                    panic(dictionary[ip]);
                },
                compileonly: !0
            },
            'abort"': {
                xt: 'abort"',
                xa: function() {
                    compilecode('(abort")', nexttoken('"'));
                },
                immediate: !0,
                compileonly: !0
            },
            javaScript: {
                xt: "javaScript",
                xa: function() {
                    stack.push(eval(stack.pop()));
                }
            },
            setInterval: {
                xt: "setInterval",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    setInterval(function() {
                        execute(words[t].xa);
                    }, e);
                }
            },
            setTimeout: {
                xt: "setTimeout",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    timers.length && timers.pop(), timers.push(setTimeout(function() {
                        execute(words[t].xa);
                    }, e));
                }
            },
            cleartimers: {
                xt: "cleartimers",
                xa: cleartimers
            },
            setEventHandler: {
                xt: "setEventHandler",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop();
                    setEventHandler(n, t, e);
                }
            },
            include: {
                xt: "include",
                xa: function() {
                    var e = stack.pop();
                    loadFileHttp(e, !1, callback_include);
                }
            },
            doDotHtml: {
                xt: "doDotHtml",
                xa: function() {
                    var e = stack.pop(), t = dictionary[ip++];
                    systemtype("<" + t + ">" + e + "</" + t + ">");
                },
                compileonly: !0
            },
            ".tag": {
                xt: ".tag",
                xa: function() {
                    var e = stack.pop(), t = nexttoken();
                    compiling ? compilecode("doDotHtml", t) : systemtype("<" + t + ">" + e + "</" + t + ">");
                },
                immediate: !0
            },
            doAppendToTagID: {
                xt: "doAppendToTagID",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e == "string" || e <= 0 || e > 0) e = document.createTextNode(e);
                    var t = dictionary[ip++], n = document.getElementById(t);
                    n.appendChild(e);
                },
                compileonly: !0
            },
            ">tagid": {
                xt: ">tagid",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e == "string" || e <= 0 || e > 0) e = document.createTextNode(e);
                    var t = nexttoken();
                    if (compiling) compilecode("doAppendToTagID", t); else {
                        var n = document.getElementById(t);
                        n.appendChild(e);
                    }
                },
                immediate: !0
            },
            doCreateElement: {
                xt: "doCreateElement",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e == "string" || e <= 0 || e > 0) e = document.createTextNode(e);
                    var t = dictionary[ip++], n = document.createElement(t);
                    n.appendChild(e), stack.push(n);
                },
                compileonly: !0
            },
            ">tag": {
                xt: ">tag",
                xa: function() {
                    var e = stack.pop();
                    if (typeof e == "string" || e <= 0 || e > 0) e = document.createTextNode(e);
                    var t = nexttoken();
                    if (compiling) compilecode("doCreateElement", t); else {
                        var n = document.createElement(t);
                        n.appendChild(e), stack.push(n);
                    }
                },
                immediate: !0
            },
            doAppendChildNode: {
                xt: "doAppendChildNode",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    if (typeof e == "string" || t <= 0 || t > 0) t = document.createTextNode(t);
                    t.appendChild(e), stack.push(t);
                },
                compileonly: !0
            },
            ">tagnode": {
                xt: ">tagnode",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    if (typeof e == "string" || t <= 0 || t > 0) t = document.createTextNode(t);
                    compiling ? compilecode("doAppendChildNode") : (t.appendChild(e), stack.push(t));
                },
                immediate: !0
            },
            virtualkeyboard: {
                xt: "showWordKinds",
                xa: virtualkeyboard
            },
            doCanvas: {
                xt: "doCanvas",
                xa: function() {
                    stack.push(dictionary[ip]), ret();
                },
                compileonly: !0
            },
            "(canvas)": {
                xt: "(canvas)",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: pCanvas
            },
            canvas: {
                xt: "canvas",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken(), t = document.getElementById(e);
                    words[e] = {
                        xt: e,
                        xa: here
                    }, compilecode("doCanvas", cv = t.getContext("2d")), compilecode("exit");
                }
            },
            doDraw: {
                xt: "doDraw",
                xa: function() {
                    var e = dictionary[ip++], t = dictionary[ip++], n = dictionary[ip], r = stack.splice(stack.length - n, n);
                    f = e[t], f.apply(e, r), ret();
                },
                compileonly: !0
            },
            newCanvas: {
                xt: "newCanvas:",
                xa: function() {
                    var e = [ [ "rect", 4 ], [ "fillRect", 4 ], [ "strokeRect", 4 ], [ "clearRect", 4 ], [ "stroke", 0 ], [ "beginPath", 0 ] ], t = nexttoken(), n = document.getElementById(t), r = n.getContext("2d");
                    words[t] = {
                        xt: t,
                        xa: here
                    };
                    for (var i = 0; i < e.length; i++) compilecode(e[i][0]);
                    compilecode("exit");
                    for (var i = 0; i < e.length; i++) {
                        var s = t + "." + e[i][0];
                        words[s] = {
                            xt: s,
                            xa: here
                        }, compilecode("doDraw", r), compilecode(e[i][0], e[i][1]), compilecode("exit");
                    }
                }
            },
            rgb2hex: {
                xt: "rgb2hex",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop();
                    stack.push(rgb2hexstr(n, t, e));
                }
            },
            fillStyle: {
                xt: "fillStyle",
                kind: "canvas",
                stk: "( ctx color|gradient|pattern -- )",
                hlp: "憛怨颔隤�",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.fillStyle = e;
                }
            },
            strokeStyle: {
                xt: "strokeStyle",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.strokeStyle = e;
                }
            },
            shadowColor: {
                xt: "shadowColor",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.shadowColor = e;
                }
            },
            shadowBlur: {
                xt: "shadowBlur",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.shadowBlur = e;
                }
            },
            shadowOffsetX: {
                xt: "shadowOffsetX",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.shadowOffsetX = e;
                }
            },
            shadowOffsetY: {
                xt: "shadowOffsetY",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.shadowOffsetY = e;
                }
            },
            LinearGradient: {
                xt: "LinearGradient",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = stack.pop(), s = stack.pop();
                    words[e] = {
                        xt: e,
                        xa: here
                    }, compilecode("doCon", s.createLinearGradient(i, r, n, t)), compilecode("exit");
                }
            },
            createLinearGradient: {
                xt: "createLinearGradient",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = stack.pop();
                    stack.push(i.createLinearGradient(r, n, t, e));
                }
            },
            RadialGradient: {
                xt: "RadialGradient",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = nexttoken(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = stack.pop(), s = stack.pop(), o = stack.pop(), u = stack.pop();
                    words[e] = {
                        xt: e,
                        xa: here
                    }, compilecode("doCon", u.createLinearGradient(o, s, i, r, n, t)), compilecode("exit");
                }
            },
            createRadialGradient: {
                xt: "createRadialGradient",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = stack.pop(), s = stack.pop(), o = stack.pop();
                    stack.push(o.createLinearGradient(s, i, r, n, t, e));
                }
            },
            addColorStop: {
                xt: "addColorStop",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("addColorStop", 2);
                }
            },
            lineCap: {
                xt: "lineCap",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.lineCap = e;
                }
            },
            lineJoin: {
                xt: "lineJoin",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.lineJoin = e;
                }
            },
            lineWidth: {
                xt: "lineWidth",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.lineWidth = e;
                }
            },
            miterLimit: {
                xt: "miterLimit",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.miterLimit = e;
                }
            },
            rect: {
                xt: "rect",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("rect", 4);
                }
            },
            fillRect: {
                xt: "fillRect",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("fillRect", 4);
                }
            },
            strokeRect: {
                xt: "strokeRect",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("strokeRect", 4);
                }
            },
            clearRect: {
                xt: "clearRect",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("clearRect", 4);
                }
            },
            fill: {
                xt: "fill",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("fill", 0);
                }
            },
            stroke: {
                xt: "stroke",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("stroke", 0);
                }
            },
            beginPath: {
                xt: "beginPath",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("beginPath", 0);
                }
            },
            moveTo: {
                xt: "moveTo",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("moveTo", 2);
                }
            },
            closePath: {
                xt: "closePath",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("closePath", 0);
                }
            },
            lineTo: {
                xt: "lineTo",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("lineTo", 2);
                }
            },
            clip: {
                xt: "clip",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("clip", 0);
                }
            },
            quadraticCurveTo: {
                xt: "quadraticCurveTo",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("quadraticCurveTo", 4);
                }
            },
            bezierCurveTo: {
                xt: "bezierCurveTo",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("bezierCurveTo", 6);
                }
            },
            arc: {
                xt: "arc",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("arc", 6);
                }
            },
            arcTo: {
                xt: "arcTo",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("arcTo", 5);
                }
            },
            isPointInPath: {
                xt: "isPointInPath",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("isPointInPath", 2);
                }
            },
            scale: {
                xt: "scale",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("scale", 2);
                }
            },
            rotate: {
                xt: "rotate",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("rotate", 1);
                }
            },
            translate: {
                xt: "translate",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("translate", 2);
                }
            },
            transform: {
                xt: "transform",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("transform", 6);
                }
            },
            setTransform: {
                xt: "setTransform",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("setTransform", 6);
                }
            },
            font: {
                xt: "font",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.font = e;
                }
            },
            textAlign: {
                xt: "textAlign",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.textAlign = e;
                }
            },
            textBaseline: {
                xt: "textBaseline",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.textBaseline = e;
                }
            },
            fillText: {
                xt: "fillText",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("fillText", 3);
                }
            },
            strokeText: {
                xt: "strokeText",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("strokeText", 4);
                }
            },
            measureText: {
                xt: "measureText",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    stack.push(t.measureText(e).width);
                }
            },
            loadImage: {
                xt: "loadImage",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = new Image;
                    e.src = stack.pop(), e.loaded = !1, e.onload = function(e) {
                        e.target.loaded = !0;
                    };
                    var t = document.createElement("imgagecache");
                    t.appendChild(e);
                    for (var n = 0; n < 5e3; n++) var r = Math.random();
                    stack.push(e);
                }
            },
            pasteImage: {
                xt: "pasteImage",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("drawImage", 3);
                }
            },
            drawImage: {
                xt: "drawImage",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("drawImage", 5);
                }
            },
            cropImage: {
                xt: "cropdrawImage",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("drawImage", 9);
                }
            },
            createImageData: {
                xt: "createImageData",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop();
                    stack.push(n.createImageData(t, e));
                }
            },
            getImageData: {
                xt: "getImageData",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop(), r = stack.pop(), i = stack.pop();
                    stack.push(i.getImageData(r, n, t, e));
                }
            },
            putImageData: {
                xt: "putImageData",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop(), n = stack.pop(), r = stack.pop();
                    stack.push(r.putImageData(n, t, e));
                }
            },
            globalAlpha: {
                xt: "globalAlpha",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.globalAlpha = e;
                }
            },
            globalCompositeOperation: {
                xt: "globalCompositeOperation",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    var e = stack.pop(), t = stack.pop();
                    t.globalCompositeOperation = e;
                }
            },
            saveState: {
                xt: "saveState",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("save", 0);
                }
            },
            restoreState: {
                xt: "restoreState",
                kind: "canvas",
                stk: "",
                hlp: "",
                xa: function() {
                    applyByFuncNameAndArgNum("restore", 0);
                }
            }
        };
        fence = words.length, this.exec = exec, this.loadFileHttp = loadFileHttp;
        var preLoadHiWords = [ ": nop ;", ': version c" Version: 1.1.9"  ;', ": show_code >in .tag pre ; alias show_code 憿舐內蝔鲳�蝣� end_alias", "alias dup 銴� drop 銝� swap �� end_alias", "alias to 蝯� var ���蔃��� tick 閰靗��亦Ⅳ exit ���� end_alias", "alias create 摰梄儔��憛� @ �綤����批捆 end_alias", "alias 0<> 銝讵��潮灐 > 憭扳蒽 <> 銝讵��� >= 銝菝��� end_alias", "alias && 銝� || �� !! �血� if �亦� else �血� then �嗅� do �� loop 敺芰撃 leave 頝喳婵敺芰撃 end_alias", 'alias c" 摮�" s" 摮ⓓ葡" end_alias', "alias today 隞簧鞒 now 甇斗� msec 蝮賣神蝘� end_alias", "alias setInterval �猟��瑁� end_alias", "code math_ceil {var p=stack.pop();var r=Math.ceil(p);stack.push(r);}", "code math_exp {var p=stack.pop();var r=Math.exp(p);stack.push(r); } ", "code math_floor {var p=stack.pop();var r=Math.floor(p);stack.push(r); } ", "code math_log {var p=stack.pop();var r=Math.log(p);stack.push(r);  } ", "code math_pow {var p2=stack.pop();var p1=stack.pop();var r=Math.pow(p1,p2);stack.push(r);} ", "code math_sq {var p=stack.pop();var r= p * p;stack.push(r);  } ", "code math_round {var p=stack.pop();var r=Math.round(p);stack.push(r);  } ", "code math_sqrt {var p=stack.pop();var r=Math.sqrt(p);stack.push(r);  } " "code math_max {var p2=stack.pop();var p1=stack.pop();var r=p1 < p2 ? p2 : p1;stack.push(r);} ", "code math_min {var p2=stack.pop();var p1=stack.pop();var r=p1 < p2 ? p1 : p2;stack.push(r);} ", "code math_greatest {var argnum=stack.pop();var args=stack.splice(stack.length-argnum,argnum);var                     r=Math.max.apply(null,args);stack.push(r);  } ", "code math_least {var argnum=stack.pop();var args=stack.splice(stack.length-argnum,argnum);var                 r=Math.min.apply(null,args);stack.push(r);  } ", "code math_cos {var p=stack.pop();var r=Math.cos(p);stack.push(r);  } ", "code math_sin {var p=stack.pop();var r=Math.sin(p);stack.push(r);  } ", "code math_tan {var p=stack.pop();var r=Math.tan(p);stack.push(r);  } ", "code math_acos {var p=stack.pop();var r=Math.acos(p);stack.push(r);  } ", "code math_asin {var p=stack.pop();var r=Math.asin(p);stack.push(r);  } ", "code math_atan {var p=stack.pop();var r=Math.atan(p);stack.push(r);  } ", "code math_atan2 {var p=stack.pop();var r=Math.atan2(p);stack.push(r);  } ", "code math_pi {stack.push(Math.PI); } ", "code math_twopi {stack.push(CONST_TWO_PI); } ", "code math_halfpi {stack.push(CONST_HALF_PI); } ", "code math_thirdpi {stack.push(CONST_THIRD_PI); } ", "code math_quarterpi {stack.push(CONST_QUARTER_PI); } ", "code math_degrees {var p=stack.pop();var r= p * CONST_RAD_TO_DEG;stack.push(r);  } ", "code math_radians {var p=stack.pop();var r= p * CONST_DEG_TO_RAD;stack.push(r);  } ", "code math_mag {var p2=stack.pop();var p1=stack.pop();var r=Math.sqrt(p1 * p1 + p2 * p2);stack.push(r); } ", "code math_random {var r=Math.random();stack.push(r);  } ", "alias + �  1+ �ù� - 皜� * 銋� / �� mod �日� negate 鞎  abs 蝯刧��� math_ceil 銝箫��湔㕑 math_floor 銝鲳��湔㕑 math_sin 甇憐 math_cos 擗咓憐 math_quarterpi 45摨� math_thirdpi 60摨� math_halfpi 90摨� math_pi 180摨�  math_twopi 360摨� end_alias", "alias canvas �枞��怠� rgb2hex 蝝睐��诎��癴冯�脣饿 fillStyle 憛怨颔隤� strokeStyle 蝑痪颔隤� shadowColor 敶梯颔 shadowBlur 敶梁� shadowOffsetX 敶勗鹈蝘� shadowOffsetY 敶曹�蝘� LinearGradient 摰梄儔瞍詨惜 RadialGradient 摰梄儔�曉�瞍詨惜 addColorStop �脣�暺�  lineCap 蝺桇蜇 lineJoin 蝺桖铑 lineWidth 蝺桇祝 rect ��  fillRect 撖血��� strokeRect �寞� clearRect �镦��� beginPath �鲳�瑽鲳� closePath �桧�瑽鲳� moveTo 蝘餌� stroke 銝鲷� fill 憛怠� lineTo �樯� true �觇���  false �疡��� arc 撘� quadraticCurveTo 鈭霁活�脩� bezierCurveTo 鞎铁�脩� font 摮ⓔ� fillText 憛怠� translate 蝘餃��蔅� transform 霈箫耦 rotate �鹑� scale 蝮格粐 globalAlpha �镦� saveState 靽㎡��怠�����  restoreState �霶儔�怠�����  end_alias" ];
        preLoadHiWords = preLoadHiWords.join(" "), exec(preLoadHiWords);
    }
    function callback_runBrowserScripts(e, t, n) {
        fvm.exec(t);
    }
    function runBrowserScripts(e, t) {
        var n, r, i = document.getElementsByTagName("script"), s = [], o = [], u = document.getElementsByClassName("forth");
        for (n = u.length - 1; n >= 0; n--) o.push(u[n]);
        for (n = i.length - 1; n >= 0; n--) s.push(i[n]);
        for (n = s.length - 1; n >= 0; n--) {
            var a = s[n], f = a.getAttribute("type");
            if (f && (f.toLowerCase() === "text/forth" || f.toLowerCase() === "application/forth")) {
                if (a.getAttribute("src")) {
                    fname = a.getAttribute("src").split(/\s+/), fvm.loadFileHttp(fname, !1, e, {
                        fvm: fvm
                    });
                    continue;
                }
                source = a.textContent || a.text, fvm.exec(source);
            }
        }
        for (n = o.length - 1; n >= 0; n--) {
            var l = o[n], c = l.getAttribute("forthcode");
            fvm.clearlogmsg(), fvm.exec("reset"), fvm.exec(c), l.innerHTML = fvm.saylogmsg();
        }
    }
    window.ForthVM = ForthVM;
    var fvm = new ForthVM, forth_boot = function() {
        runBrowserScripts(callback_runBrowserScripts);
    };
    window.addEventListener ? window.addEventListener("DOMContentLoaded", forth_boot, !1) : window.attachEvent ? window.attachEvent("onload", forth_boot) : window.addEvent ? window.addEvent(window, "load", forth_boot) : window.onload = forth_boot;
}());

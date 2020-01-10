const editors = [];

const registerEditor = function (tag, body) {

    var sc = document.getElementsByTagName("script");
    var src;
    for (i = 0; i < sc.length; i++) {
        if (sc[i].src.match(/Editor\.js$/)) {
            src = sc[i].src.replace("Editor.js", "");
            break;
        }
    }

    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = src + "Editor.css";
    link.media = "all";
    document.getElementsByTagName("head")[0].appendChild(link);

    var imageUrl = src + "Images/";
    var undoStack = [];
    var redoStack = [];

    var getBoard = function () {
        return document.getElementById(tag + "_html");
    };

    var setCursor = function (anchorNode, anchorOffset, focusNode, focusOffset, collapse) {
        var range = document.createRange();
        var sel = window.getSelection();

        range.setStart(anchorNode, anchorOffset);
        range.setEnd(focusNode, focusOffset);

        if (collapse !== undefined) {
            range.collapse(collapse);
        }

        sel.removeAllRanges();
        sel.addRange(range);
    };

    this.save = function () {
        return getBoard().innerHTML;
    };

    var isInBoard = function () {
        var board = getBoard();
        var n = document.getSelection().anchorNode;

        while (n !== board && n !== null) {
            n = n.parentNode;
        }

        if (n !== board) {
            return false;
        }

        return true;
    };

    var setStyle = function (name, value) {

        if (!isInBoard()) {
            console.log("Not in board");
            return;
        }

        var sel = document.getSelection();

        if (sel.anchorNode === null || sel.focusNode === null) {
            console.log("Node is null");
            return;
        }

        if (sel.anchorNode === sel.focusNode
            && sel.anchorOffset === sel.focusOffset) {
            console.log("Nothing selected");
            return;
        }

        undoStack.push(getBoard().innerHTML);

        var flag = 0, span, i;
        var distance = sel.anchorNode.compareDocumentPosition(sel.focusNode);
        var sn, en, asn, aen, start, end, direction;
        if (distance === 4 || distance === 16 || distance === 0) {
            direction = 0;
            sn = sel.anchorNode;
            en = sel.focusNode;
        } else {
            direction = 1;
            sn = sel.focusNode;
            en = sel.anchorNode;
        }
        start = sel.getRangeAt(0).startOffset;
        end = sel.getRangeAt(0).endOffset;
        var trv = function (node) {
            if (node.nodeType === 3) {
                if (node === sn) {
                    //cover from start
                    console.log("anchor : " + node.textContent + ", pos : " + start);
                    flag = 1;
                    span = document.createElement("span");
                    if (Array.isArray(name)) {
                        for (i = 0; i < name.length; i++) {
                            span.style[name[i]] = value[i];
                        }
                    } else {
                        span.style[name] = value;
                    }
                    span.appendChild(document.createTextNode(
                        node.textContent.substring(start, node.textContent.length)));
                    node.parentNode.replaceChild(span, node);
                    asn = document.createTextNode(node.textContent.substring(0, start));
                    span.parentNode.insertBefore(asn, span);
                    if (direction === 0) asn = span.childNodes[0];
                }
                else if (node !== en && flag === 1) {
                    //cover all
                    console.log("normal : " + node.textContent);
                    if (Array.isArray(name)) {
                        for (i = 0; i < name.length; i++) {
                            node.parentNode.style[name[i]] = value[i];
                        }
                    } else {
                        node.parentNode.style[name] = value;
                    }
                }
                else if (flag === 1) {
                    //cover before end
                    console.log("focus : " + node.textContent + ", pos : " + end);
                    flag = 0;
                    span = document.createElement("span");
                    if (Array.isArray(name)) {
                        for (i = 0; i < name.length; i++) {
                            span.style[name[i]] = value[i];
                        }
                    } else {
                        span.style[name] = value;
                    }
                    span.appendChild(document.createTextNode(
                        node.textContent.substring(0, end)));
                    node.parentNode.replaceChild(span, node);
                    aen = document.createTextNode(node.textContent.substring(
                        end, node.textContent.length));
                    if (span.nextSibling) {
                        span.parentNode.insertBefore(aen, span.nextSibling);
                    } else {
                        span.parentNode.appendChild(aen);
                    }
                    if (direction === 1) aen = span.childNodes[0];
                }
            }
            else if (node.childNodes) {
                for (var j = 0; j < node.childNodes.length; j++) {                    
                    trv(node.childNodes[j]);
                }
            }
        };

        if (sn !== en) {
            trv(getBoard());
            var range = document.createRange();
            range.setStart(asn, 0);
            range.setEnd(aen, aen.length);
            sel.removeAllRanges();
            sel.addRange(range);
        } else {
            var node = document.getSelection().anchorNode;
            span = document.createElement("span");
            if (Array.isArray(name)) {
                for (i = 0; i < name.length; i++) {
                    span.style[name[i]] = value[i];
                    console.log(name[i], value[i]);
                }
            } else {
                span.style[name] = value;
            }
            span.appendChild(document.createTextNode(
                node.textContent.substring(start, end)));
            node.parentNode.replaceChild(span, node);
            span.parentNode.insertBefore(document.createTextNode(
                node.textContent.substring(0, start)), span);
            span.parentNode.appendChild(document.createTextNode(
                node.textContent.substring(end, node.textContent.length)));
            setCursor(span.childNodes[0], 0, span.childNodes[0], span.childNodes[0].length);
        }
    };

    var setAlignment = function (direction) {

        if (!isInBoard()) {
            console.log("Not in board");
            return;
        }

        var sel = document.getSelection();

        if (sel.anchorNode === null || sel.focusNode === null) {
            console.log("Node is null");
            return;
        }

        undoStack.push(getBoard().innerHTML);

        var board = getBoard();
        var parent = sel.focusNode.parentElement;
        var div = document.createElement("div");
        div.style["textAlign"] = direction;
        if (sel.focusNode === board) {
            div.innerHTML = "&nbsp;";
            board.appendChild(div);
        }
        else if (parent === board) {
            div.innerHTML = sel.focusNode.textContent;
            board.replaceChild(div, sel.focusNode);
        } else {
            parent.style["textAlign"] = direction;
        }
    };

    //Forms
    var table, tr, td, icon, select, radio, option, modal;
    table = document.createElement("table");
    table.classList.add("editor");

    //row 1
    tr = document.createElement("tr");
    table.appendChild(tr);
    td = document.createElement("td");
    dashboard = document.createElement("div");
    td.appendChild(dashboard);
    tr.appendChild(td);
    dashboard.classList.add("dashboard");
    dashboard.setAttribute("id", tag + "_controls");
    td.appendChild(dashboard);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "ul.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () {

        if (!isInBoard()) {
            return;
        }

        undoStack.push(getBoard().innerHTML);

        var nodeType = document.getSelection().anchorNode.nodeType;
        if (nodeType === 1) {
            var html = document.getSelection().anchorNode;
            var ul = document.createElement("ul");
            html.appendChild(ul);
            var li = document.createElement("li");
            ul.appendChild(li);
            setCursor(li, 0, li, 0, false);
        }
    });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "ol.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () {

        if (!isInBoard()) {
            return;
        }

        undoStack.push(getBoard().innerHTML);

        var nodeType = document.getSelection().anchorNode.nodeType;
        if (nodeType === 1) {
            var html = document.getSelection().anchorNode;
            var ul = document.createElement("ol");
            html.appendChild(ul);
            var li = document.createElement("li");
            ul.appendChild(li);
            setCursor(li, 0, li, 0, false);
        }
    });
    dashboard.appendChild(icon);
    dashboard.appendChild(document.createTextNode(" "));

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "normal.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setStyle("fontWeight", "normal"); });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "bold.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setStyle("fontWeight", "bold"); });
    dashboard.appendChild(icon);

    dashboard.appendChild(document.createTextNode(" "));

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "overline.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setStyle("textDecoration", "overline"); });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "linethrough.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setStyle("textDecoration", "line-through"); });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "underline.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setStyle("textDecoration", "underline"); });
    dashboard.appendChild(icon);
    dashboard.appendChild(document.createTextNode(" "));

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "leftalign.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setAlignment("left"); });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "centeralign.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setAlignment("center"); });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "rightalign.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () { setAlignment("right"); });
    dashboard.appendChild(icon);
    dashboard.appendChild(document.createTextNode(" "));

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "undo.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () {
        if (undoStack.length > 0) {
            redoStack.push(getBoard().innerHTML);
            getBoard().innerHTML = undoStack.pop();
            //setcursor
        }
    });
    dashboard.appendChild(icon);

    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "redo.png");
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", function () {
        if (redoStack.length > 0) {
            undoStack.push(getBoard().innerHTML);
            getBoard().innerHTML = redoStack.pop();
            //setcursor
        }
    });
    dashboard.appendChild(icon);
    dashboard.appendChild(document.createTextNode(" "));

    //Text Color    
    var img = document.createElement("img");
    img.setAttribute("src", imageUrl + "textcolor.png");
    img.addEventListener("click", function (event) {
        var modal = document.getElementById(tag + "_textColorModal");
        if (modal.style.visibility === "hidden"
            || !modal.style.visibility) {
            modal.style.visibility = "visible";
        }
        else
            modal.style.visibility = "hidden";
    });
    dashboard.appendChild(img);

    modal = document.createElement("div");
    modal.id = tag + "_textColorModal";
    modal.style.left = "330px";
    modal.classList.add("modal");
    dashboard.appendChild(modal);

    var textColor = setColorPicker(modal);
    var textColorSelect = function (color) {
        setStyle("color", color);
    };
    textColor.setOnSelect(textColorSelect);

    //Text Background        
    img = document.createElement("img");
    img.setAttribute("src", imageUrl + "backgroundcolor.png");
    img.addEventListener("click", function (event) {
        var modal = document.getElementById(tag + "_textBackgroundModal");
        if (modal.style.visibility === "hidden"
            || !modal.style.visibility) {
            modal.style.visibility = "visible";
        }
        else
            modal.style.visibility = "hidden";
    });
    dashboard.appendChild(img);

    modal = document.createElement("div");
    modal.id = tag + "_textBackgroundModal";
    modal.style.left = "350px";
    modal.classList.add("modal");
    dashboard.appendChild(modal);
    textColor = setColorPicker(modal);
    textColorSelect = function (color) {
        setStyle("backgroundColor", color);
    };
    textColor.setOnSelect(textColorSelect);

    //dropdown        
    select = document.createElement("select");
    select.addEventListener("change", function (obj) { setStyle("fontFamily", obj.target.value); });
    dashboard.appendChild(select);

    option = document.createElement("option");
    option.setAttribute("value", "Arial");
    option.innerText = "Arial";
    select.appendChild(option);

    option = document.createElement("option");
    option.setAttribute("value", "Courier");
    option.innerText = "Courier";
    select.appendChild(option);

    option = document.createElement("option");
    option.setAttribute("value", "Times");
    option.innerText = "Times";
    select.appendChild(option);

    select = document.createElement("select");
    option;
    select.addEventListener("change", function (obj) { setStyle("fontSize", obj.target.value); });
    dashboard.appendChild(select);
    dashboard.appendChild(document.createTextNode(" "));

    for (var i = 16; i <= 48; i += 4) {
        option = document.createElement("option");
        option.setAttribute("value", i + "px");
        option.innerText = i + "px";
        select.appendChild(option);
    }

    select = document.createElement("select");
    select.setAttribute("id", tag + "_tablesize");
    dashboard.appendChild(select);

    for (i = 100; i <= 600; i += 50) {
        option = document.createElement("option");
        option.setAttribute("value", i);
        option.innerText = i + "px";

        if (i === 400) {
            option.selected = true;
        }

        select.appendChild(option);
    }

    //table
    icon = document.createElement("img");
    icon.setAttribute("src", imageUrl + "table.png");
    var onClickTablePicker = function (event) {
        var modal = document.getElementById(tag + "_tableModal");
        console.log("click");
        if (modal.style.visibility === "hidden"
            || !modal.style.visibility) {
            modal.style.visibility = "visible";
        }
        else
            modal.style.visibility = "hidden";
    };
    icon.addEventListener("mousedown", function (event) { event.preventDefault(); });
    icon.addEventListener("click", onClickTablePicker);
    dashboard.appendChild(icon);
    modal = document.createElement("div");
    modal.id = tag + "_tableModal";        
    modal.style.left = "400px";
    modal.classList.add("modal");
    dashboard.appendChild(modal);
    setTablePicker(modal, tag);

    //compose, html
    dashboard = document.createElement("td");
    tr.appendChild(dashboard);
    table.appendChild(tr);
    dashboard.style.textAlign = "right";
    radio = document.createElement("input");
    radio.type = "radio";
    radio.name = tag + "_viewtype";
    radio.value = "compose";
    radio.checked = "checked";
    dashboard.appendChild(document.createTextNode("compose"));
    dashboard.appendChild(radio);

    var onchange = function (value) {
        var board = getBoard();
        var controls = document.getElementById(tag + "_controls");
        if (value === "compose") {
            board.innerHTML = board.innerText;
            controls.style.display = "";
        } else {
            board.innerText = board.innerHTML;
            controls.style.display = "none";

        }
    };

    radio.addEventListener("change", function (event) {
        onchange(event.target.value);
    });

    radio = document.createElement("input");
    radio.type = "radio";
    radio.name = tag + "_viewtype";
    radio.value = "html";
    dashboard.appendChild(document.createTextNode("html"));
    dashboard.appendChild(radio);

    radio.addEventListener("change", function (event) {
        onchange(event.target.value);
    });

    //board
    tr = document.createElement("tr");
    table.appendChild(tr);
    var html = document.createElement("td");
    html.style.width = "500px";
    tr.appendChild(html);
    html.colSpan = 2;

    var htmldiv = document.createElement("div");
    html.appendChild(htmldiv);
    htmldiv.setAttribute("contentEditable", "true");
    htmldiv.classList.add("board");
    htmldiv.setAttribute("id", tag + "_html");

    htmldiv.addEventListener("keydown", function (event) {
        if (event.keyCode === 9) { //tabkey            
            event.preventDefault();
            if (window.getSelection().anchorNode.nodeName === "LI"
                || window.getSelection().anchorNode.parentNode.nodeName === "LI") {

                var li;
                if (window.getSelection().anchorNode.nodeName === "LI") {
                    li = window.getSelection().anchorNode;
                } else {
                    li = window.getSelection().anchorNode.parentNode;
                }

                var listNode;
                if (li.parentElement.nodeName === "UL")
                    listNode = document.createElement("ul");
                else if (li.parentElement.nodeName === "OL")
                    listNode = document.createElement("ol");
                else return;

                li.appendChild(listNode);
                var li2 = document.createElement("li");
                listNode.appendChild(li2);
                setCursor(li2, 0, li2, 0, false);
            }
        }
        else if (event.ctrlKey && event.keyCode === 89) { //ctrl y
            event.preventDefault();
            if (redoStack.length > 0) {
                undoStack.push(getBoard().innerHTML);
                getBoard().innerHTML = redoStack.pop();
            }
        }
        else if (event.ctrlKey && event.keyCode === 90) { //ctrl z
            event.preventDefault();
            if (undoStack.length > 0) {
                redoStack.push(getBoard().innerHTML);
                getBoard().innerHTML = undoStack.pop();
            }
        }
        else { //changes            
            var removeKey = (event.ctrlKey
                && (event.keyCode === 86 || event.keyCode === 88))
                || event.keyCode === 46 || event.keyCode === 8;

            var inputKey = (!event.ctrlKey && !event.altKey)
                && ((event.keyCode >= 48 && event.keyCode <= 90)
                    || (event.keyCode >= 186 && event.keyCode <= 191)
                    || (event.keyCode >= 219 && event.keyCode <= 222));

            if (removeKey || inputKey) {
                undoStack.push(getBoard().innerHTML);
            }
        }
    });

    document.getElementById(tag).appendChild(table);
    editors[tag] = this;

    if (body !== undefined) {
        htmldiv.innerHTML = body;
    }
};

const registerColorPicker = function (body) {

    this.setOnSelect = function (event) {
        onSelect = event;
    };
    var onSelect = function (color) {

    };
    var onClick = function (event) {
        onSelect(event.target.rgb);
        body.style.visibility = "hidden";
    };

    var table = document.createElement("table");
    table.classList.add("colorpicker");
    body.appendChild(table);
    var tr, td, i, j, k, num = 0, rep = 0, tmp, bin;
    tr = document.createElement("tr");
    table.appendChild(tr);

    td = document.createElement("td");
    input = document.createElement("input");
    input.setAttribute("type", "color");
    input.addEventListener("change", function (event) {
        onSelect(event.target.value);
        body.style.visibility = "hidden";
    });

    td.appendChild(input);
    tr.appendChild(td);

    for (i = 0; i < 5; i++) {
        if (i === 0) num = 0;
        else num = 64 * i - 1;
        td = document.createElement("td");
        tmp = num.toString(16);
        tmp = "00".substring(0, 2 - tmp.length) + tmp;
        td.rgb = "#";
        for (j = 0; j < 3; j++) {
            td.rgb += tmp;
        }
        td.style.backgroundColor = td.rgb;
        td.title = td.rgb;
        td.addEventListener("click", onClick);
        tr.appendChild(td);
    }

    var bins = [];
    for (i = 1; i < 7; i++) {
        bin = i.toString(2);
        bin = "000".substring(0, 3 - bin.length) + bin;
        bins.push(bin);
    }

    for (i = 1; i < 5; i++) {
        tr = document.createElement("tr");
        table.appendChild(tr);
        for (j = 1; j < 7; j++) {
            num = 64 * i - 1;
            td = document.createElement("td");
            tr.appendChild(td);
            td.rgb = "#";
            for (k = 0; k < 3; k++) {
                if (rep === 1) {
                    if (bins[j - 1].charAt(k) === "0") {
                        tmp = num.toString(16);
                    } else {
                        tmp = (64 * 4 - 1).toString(16);
                    }
                }
                else {
                    tmp = (bins[j - 1].charAt(k) * num).toString(16);
                }
                td.rgb += "00".substring(0, 2 - tmp.length) + tmp;
            }
            td.title = td.rgb;
            td.style.backgroundColor = td.rgb;
            td.addEventListener("click", onClick);
        }
        if (i === 4 && rep === 0) {
            i = 1;
            rep = 1;
        }
        if (i === 3 && rep === 1) {
            break;
        }
    }

    return this;
};

const registerTablePicker = function (body, tag) {

    var table = document.createElement("table");
    table.classList.add("tablepicker");

    table.addEventListener("mouseover", function (event) {
        var t = event.target;
        var i, j, td;
        for (i = 0; i < 10; i++) {
            for (j = 0; j < 10; j++) {
                td = document.getElementById(tag + "_" + i + "/" + j);

                if (i <= t.i && j <= t.j) {
                    td.style.backgroundColor = "gray";
                }
                else {
                    td.style.backgroundColor = "white";
                }
            }
        }
    });

    table.addEventListener("mouseout", function (event) {
        var i, j, td;
        for (i = 0; i < 10; i++) {
            for (j = 0; j < 10; j++) {
                td = document.getElementById(tag + "_" + i + "/" + j);
                td.style.backgroundColor = "white";
            }
        }
    });

    table.addEventListener("click", function (event) {

        var board = document.getElementById(tag + "_html");
        var widths = document.getElementById(tag + "_tablesize");

        var node = document.getSelection().anchorNode;
        var n = node;

        while (n !== board) {
            n = n.parentNode;
        }

        if (node.nodeType === 1 && n === board) {
            var table = document.createElement("table");
            table.style.width = widths.value + "px";
            var x = event.target.j + 1, y = event.target.i + 1;
            node.appendChild(table);
            var tr, td, i, j;
            for (i = 0; i < y; i++) {
                tr = document.createElement("tr");
                table.appendChild(tr);
                for (j = 0; j < x; j++) {
                    td = document.createElement("td");
                    tr.appendChild(td);
                }
            }
            body.style.visibility = "hidden";
            board.focus();
        }
    });

    body.appendChild(table);
    var tr, td, i, j;

    for (i = 0; i < 10; i++) {
        tr = document.createElement("tr");
        table.appendChild(tr);

        for (j = 0; j < 10; j++) {
            td = document.createElement("td");
            td.setAttribute("id", tag + "_" + i + "/" + j);
            td.i = i;
            td.j = j;
            tr.appendChild(td);
        }
    }
    return this;
};

const setEditor = function (tag, body) {
    return registerEditor(tag, body);
};

const setColorPicker = function (body) {
    return registerColorPicker(body);
};

const setTablePicker = function (body, tag) {
    return registerTablePicker(body, tag);
};
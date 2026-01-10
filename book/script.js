function clearFilters() {
    if($("filter-text")) $("filter-text").value = "";
    if($("filter-year")) $("filter-year").value = "";
    if($("filter-month")) $("filter-month").value = "";
    if($("filter-rating")) $("filter-rating").value = "";
    filterState = { text: "", year: "", month: "", rating: "" };
    applyFilters();
    closeMenu(); 
}

function renderBooks() {
    const list = $("book-list");
    if(!list) return;

    list.innerHTML = "";
    
    // 1. Get ALL books for current shelf
    let allItems = library[currentShelf] || [];
    let visibleItems = allItems;
    
    const term = (filterState.text || "").toLowerCase();
    const cleanTerm = term.replace(/[\s-]/g, "");

    // 2. Filter logic
    if (term || filterState.year || filterState.month || filterState.rating) {
        visibleItems = allItems.filter(b => {
            const matchText = !term || 
                b.title.toLowerCase().includes(term) || 
                getAuthorName(b).toLowerCase().includes(term) ||
                (b.isbn && b.isbn.replace(/[\s-]/g, "").toLowerCase().includes(cleanTerm));
            let dateStr = currentShelf === 'read' ? b.dateRead : (currentShelf === 'loans' ? b.returnDate : "");
            const matchYear = !filterState.year || (dateStr && dateStr.startsWith(filterState.year));
            const matchMonth = !filterState.month || (dateStr && dateStr.substring(5,7) === filterState.month);
            const matchRating = !filterState.rating || (b.rating === Number(filterState.rating));
            return matchText && matchYear && matchMonth && matchRating;
        });
    }

    // 3. UI UPDATES FOR COUNTS
    const totalCount = allItems.length;
    const filteredCount = visibleItems.length;
    const isFiltering = totalCount !== filteredCount;

    // A) Update Menu Counter (e.g. "3 / 42")
    // First reset all to base numbers
    updateShelfCounts(); 
    // Then override the active one if filtering
    if (isFiltering) {
        const activeLabel = $(`count-${currentShelf}`);
        if(activeLabel) activeLabel.textContent = `${filteredCount} / ${totalCount}`;
    }

    // B) Update Main Screen Status Bar
    const statusEl = $("filter-status");
    if (statusEl) {
        if (isFiltering) {
            // Show bar
            statusEl.style.display = "flex";
            statusEl.innerHTML = `
                <span>Showing <b>${filteredCount}</b> of ${totalCount} books</span>
                <span class="filter-clear-link" onclick="clearFilters()">Clear</span>
            `;
        } else {
            // Hide bar
            statusEl.style.display = "none";
        }
    }

    // 4. Render List
    visibleItems.slice().reverse().forEach(b => {
        const li = document.createElement("li"); li.className = "book-card";
        
        const menuContainer = document.createElement("div");
        menuContainer.className = "card-menu-container";
        const dotsBtn = document.createElement("button");
        dotsBtn.className = "dots-btn";
        dotsBtn.innerHTML = "⋮";
        dotsBtn.onclick = (e) => {
            e.stopPropagation();
            document.querySelectorAll('.menu-dropdown.show').forEach(d => d.classList.remove('show'));
            const dropdown = menuContainer.querySelector('.menu-dropdown');
            dropdown.classList.toggle('show');
        };
        const dropdown = document.createElement("div");
        dropdown.className = "menu-dropdown";
        
        if (currentShelf === 'read') {
            const editDateBtn = document.createElement("button");
            editDateBtn.className = "menu-item";
            editDateBtn.innerHTML = t("changeDate");
            editDateBtn.onclick = () => {
                const dateSpan = document.getElementById(`date-display-${b.id}`);
                const dateInput = document.getElementById(`date-input-${b.id}`);
                if(dateSpan && dateInput) {
                    dateSpan.style.display = "none";
                    dateInput.style.display = "inline-block";
                    dateInput.focus();
                    dateInput.showPicker(); 
                }
            };
            dropdown.appendChild(editDateBtn);
        }
        const copyBtn = document.createElement("button");
        copyBtn.className = "menu-item";
        copyBtn.innerHTML = t("copyTitle");
        copyBtn.onclick = () => { navigator.clipboard.writeText(b.title); };
        dropdown.appendChild(copyBtn);
        menuContainer.appendChild(dotsBtn);
        menuContainer.appendChild(dropdown);
        li.appendChild(menuContainer);

        const info = document.createElement("div"); info.className = "book-info";
        
        const badges = document.createElement("div");
        badges.className = "badges-row";
        if(b.returnDate && currentShelf === 'loans') {
            const loanBadge = document.createElement("div"); 
            loanBadge.className = "loan-badge"; 
            loanBadge.textContent = t("due") + " " + b.returnDate;
            badges.appendChild(loanBadge);
        }
        if(b.isAudio) {
            const audioBadge = document.createElement("div"); 
            audioBadge.className = "audio-badge"; 
            audioBadge.textContent = t("audio"); 
            badges.appendChild(audioBadge);
        }
        if(badges.children.length > 0) info.appendChild(badges);

        const img = document.createElement(b.cover ? "img" : "div"); img.className = "book-thumb";
        if(b.cover) { img.src = b.cover; img.onerror = () => { img.style.display='none'; }; } 
        else { img.style.background = "#ddd"; }
        li.appendChild(img);

        const title = document.createElement("div"); title.className = "book-title"; title.textContent = b.title;
        const meta = document.createElement("div"); meta.className = "book-meta";
        const authorDiv = document.createElement("div"); authorDiv.textContent = getAuthorName(b);
        meta.appendChild(authorDiv);

        if(currentShelf==='read' && b.dateRead) {
            const dateDiv = document.createElement("div");
            const dateSpan = document.createElement("span");
            dateSpan.id = `date-display-${b.id}`;
            dateSpan.textContent = `${t("finished")} ${b.dateRead}`;
            
            const dateInput = document.createElement("input");
            dateInput.type = "date";
            dateInput.id = `date-input-${b.id}`;
            dateInput.className = "date-edit-input";
            dateInput.value = b.dateRead;
            dateInput.onchange = (e) => { updateReadDate(b.id, e.target.value); };
            dateInput.onblur = () => {
                setTimeout(() => {
                    dateInput.style.display = "none";
                    dateSpan.style.display = "inline";
                }, 200);
            };
            dateDiv.appendChild(dateSpan);
            dateDiv.appendChild(dateInput);
            meta.appendChild(dateDiv);
        }
        info.appendChild(title); 
        info.appendChild(meta);
        if(b.isbn) {
            const isbnPill = document.createElement("div"); 
            isbnPill.className = "isbn-pill"; 
            isbnPill.textContent = `ISBN: ${b.isbn}`; 
            info.appendChild(isbnPill);
        }

        const actions = document.createElement("div"); actions.className = "actions";
        if (currentShelf === 'read') {
            const sel = document.createElement("select"); sel.className = "rating";
            sel.innerHTML = `<option value="0">...</option>` + [1,2,3,4,5].map(n => `<option value="${n}" ${b.rating===n?'selected':''}>${'⭐'.repeat(n)}</option>`).join('');
            sel.onchange = (e) => updateRating(b.id, e.target.value);
            info.appendChild(sel);
            const unreadBtn = document.createElement("button"); 
            unreadBtn.className = "btn-sm btn-unread"; 
            unreadBtn.textContent = t("unread");
            unreadBtn.onclick = () => moveToWishlist(b.id);
            actions.appendChild(unreadBtn);
        } else {
            const moveBtn = document.createElement("button"); 
            moveBtn.className = "move-btn"; 
            moveBtn.textContent = t("markRead");
            moveBtn.onclick = () => moveToRead(b.id);
            actions.appendChild(moveBtn);
        }
        const delBtn = document.createElement("button"); 
        delBtn.className = "btn-del"; 
        delBtn.textContent = "🗑️";
        delBtn.onclick = () => deleteBook(b.id);
        actions.appendChild(delBtn);

        if(currentShelf === 'loans' && b.returnDate) {
            const calBtn = document.createElement("button"); calBtn.className = "btn-cal"; calBtn.textContent = t("reminder");
            calBtn.onclick = () => processCalendar(b);
            actions.appendChild(calBtn);
        }
        info.appendChild(actions); li.appendChild(info); list.appendChild(li);
    });
}

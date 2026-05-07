const searchForm = document.getElementById('search-form');
const leadsTableBody = document.getElementById('leads-table-body');
const oldLeadsTableBody = document.getElementById('old-leads-table-body');
const loading = document.getElementById('loading');
const totalLeadsEl = document.getElementById('total-leads');
const newLeadsEl = document.getElementById('new-leads');
const listedLeadsEl = document.getElementById('listed-leads');
const refreshBtn = document.getElementById('refresh-btn');

let lastSearchResults = [];

async function fetchLeads() {
    try {
        const response = await fetch('/api/leads');
        const allLeads = await response.json();
        renderLeads(allLeads);
        updateStats(allLeads);
    } catch (error) {
        console.error('Error fetching leads:', error);
    }
}

function renderLeads(allLeads) {
    // Determine which leads are truly "New" (from the current search)
    // and which are "Old" (everything else in the DB)
    
    const currentPhones = lastSearchResults.map(r => r.phone);
    
    // Novos: Leads that were found in the current search
    const newLeads = lastSearchResults;
    
    // Antigos: Leads in the database that were NOT found in the current search
    const oldLeads = allLeads.filter(l => !currentPhones.includes(l.phone));

    const generateHtml = (list) => {
        if (list.length === 0) return '<tr><td colspan="5" style="text-align: center; opacity: 0.5; padding: 2rem;">Nenhum registro encontrado</td></tr>';
        
        return list.map(lead => {
            const cleanPhone = (lead.phone || '').replace(/\D/g, '');
            const waNumber = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;
            const status = lastSearchResults.some(r => r.phone === lead.phone) ? 
                          (lastSearchResults.find(r => r.phone === lead.phone).status) : 'NOVO';
            
            return `
            <tr>
                <td style="font-weight: 600;">${lead.name}</td>
                <td>
                    <a href="tel:${lead.phone}" class="phone-link">
                        <i class="fas fa-phone-alt"></i>${lead.phone}
                    </a>
                </td>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${lead.address}</td>
                <td>
                    <span class="badge ${status === 'NOVO' ? 'badge-new' : 'badge-listed'}">
                        ${status}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="icon-btn" onclick="copyToClipboard('${lead.phone}')" title="Copiar Telefone">
                            <i class="far fa-copy"></i>
                        </button>
                        <a href="https://wa.me/${waNumber}" target="_blank" class="icon-btn" title="WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>
                </td>
            </tr>
        `}).join('');
    };

    leadsTableBody.innerHTML = generateHtml(newLeads);
    oldLeadsTableBody.innerHTML = generateHtml(oldLeads);
}

function updateStats(leads) {
    totalLeadsEl.textContent = leads.length;
    newLeadsEl.textContent = lastSearchResults.filter(l => l.status === 'NOVO').length;
    listedLeadsEl.textContent = lastSearchResults.filter(l => l.status === 'JA LISTADO').length;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('Telefone copiado!');
}

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nicho = document.getElementById('nicho').value;
    const estado = document.getElementById('estado').value;
    const limit = document.getElementById('limit').value;
    
    const query = `${nicho} em ${estado}`;
    
    loading.style.display = 'block';
    const searchBtn = document.getElementById('search-btn');
    searchBtn.disabled = true;
    
    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, limit: parseInt(limit) })
        });
        
        const results = await response.json();
        lastSearchResults = results; // Save current search results
        console.log('Search results:', results);
        await fetchLeads();
    } catch (error) {
        alert('Erro ao realizar busca: ' + error.message);
    } finally {
        loading.style.display = 'none';
        searchBtn.disabled = false;
    }
});

refreshBtn.addEventListener('click', () => {
    lastSearchResults = []; // Clear current search on manual refresh
    fetchLeads();
});

// Initial load
fetchLeads();

export const backupService = {
  exportFullBackup(data: Record<string, any>): void {
    const backupPayload = {
      version: 'SIGE_ANGOLA_V5',
      exportDate: new Date().toISOString(),
      system: 'SIGE Angola - Sistema Integrado de Gestão Escolar',
      data,
    };

    const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-sige-angola-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  exportTableToCSV(filename: string, rows: Record<string, any>[]): void {
    if (!rows || rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => 
        headers.map(header => {
          const val = row[header];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';')
      )
    ].join('\r\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

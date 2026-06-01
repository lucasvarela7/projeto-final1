const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const exportarEntregasExcel = async (req, res, next) => {
  try {
    const { status, data_inicio, data_fim } = req.query;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND e.status = ?'; params.push(status); }
    if (data_inicio) { where += ' AND e.criado_em >= ?'; params.push(data_inicio); }
    if (data_fim) { where += ' AND e.criado_em <= ?'; params.push(data_fim); }

    const [rows] = await db.query(
      `SELECT e.codigo, e.cliente_nome, e.cliente_telefone, e.endereco_origem, e.endereco_destino,
              e.cidade_destino, e.status, e.data_saida, e.data_prevista, e.data_entrega,
              m.nome as motorista, r.nome as rota
       FROM entregas e
       LEFT JOIN motoristas m ON e.motorista_id = m.id
       LEFT JOIN rotas r ON e.rota_id = r.id
       ${where} ORDER BY e.criado_em DESC`,
      params
    );

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LogiTrack';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Entregas', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    // Cabeçalho estilizado
    sheet.mergeCells('A1:L1');
    sheet.getCell('A1').value = 'LOGITRACK - Relatório de Entregas';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;

    sheet.mergeCells('A2:L2');
    sheet.getCell('A2').value = `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
    sheet.getCell('A2').font = { italic: true, size: 10 };
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    const headers = ['Código', 'Cliente', 'Telefone', 'Origem', 'Destino', 'Cidade', 'Status', 'Data Saída', 'Data Prevista', 'Data Entrega', 'Motorista', 'Rota'];
    const headerRow = sheet.addRow(headers);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16213e' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF0f3460' } } };
    });
    headerRow.height = 20;

    const statusColors = {
      'pendente': 'FFFFF3cd',
      'em_preparacao': 'FFcce5ff',
      'em_rota': 'FFd4edda',
      'entregue': 'FFd1ecf1',
      'cancelada': 'FFf8d7da'
    };

    rows.forEach((row, i) => {
      const dataRow = sheet.addRow([
        row.codigo, row.cliente_nome, row.cliente_telefone || '-',
        row.endereco_origem, row.endereco_destino, row.cidade_destino || '-',
        row.status?.replace('_', ' ').toUpperCase(),
        row.data_saida ? new Date(row.data_saida).toLocaleDateString('pt-BR') : '-',
        row.data_prevista ? new Date(row.data_prevista).toLocaleDateString('pt-BR') : '-',
        row.data_entrega ? new Date(row.data_entrega).toLocaleDateString('pt-BR') : '-',
        row.motorista || '-', row.rota || '-'
      ]);

      const bgColor = statusColors[row.status] || 'FFFFFFFF';
      dataRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFdddddd' } } };
      });
    });

    sheet.columns = [
      { width: 16 }, { width: 25 }, { width: 16 }, { width: 35 }, { width: 35 },
      { width: 18 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 14 },
      { width: 20 }, { width: 20 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=logitrack-entregas-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) { next(error); }
};

const exportarEntregasPDF = async (req, res, next) => {
  try {
    const { status } = req.query;
    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND e.status = ?'; params.push(status); }

    const [rows] = await db.query(
      `SELECT e.codigo, e.cliente_nome, e.endereco_destino, e.cidade_destino,
              e.status, e.data_prevista, e.data_entrega, m.nome as motorista
       FROM entregas e
       LEFT JOIN motoristas m ON e.motorista_id = m.id
       ${where} ORDER BY e.criado_em DESC LIMIT 100`,
      params
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=logitrack-entregas-${Date.now()}.pdf`);
    doc.pipe(res);

    // Cabeçalho
    doc.rect(0, 0, doc.page.width, 70).fill('#1a1a2e');
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold').text('LogiTrack', 40, 15);
    doc.fontSize(11).font('Helvetica').text('Sistema de Logística e Rastreamento de Entregas', 40, 42);
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 40, 56);

    doc.moveDown(3);

    // Tabela
    const tableTop = 90;
    const cols = [
      { label: 'Código', x: 40, w: 90 },
      { label: 'Cliente', x: 135, w: 130 },
      { label: 'Destino', x: 270, w: 150 },
      { label: 'Status', x: 425, w: 90 },
      { label: 'Dt. Prevista', x: 520, w: 80 },
      { label: 'Motorista', x: 605, w: 120 }
    ];

    // Header da tabela
    doc.rect(40, tableTop, doc.page.width - 80, 22).fill('#16213e');
    cols.forEach(col => {
      doc.fillColor('white').fontSize(9).font('Helvetica-Bold').text(col.label, col.x, tableTop + 6, { width: col.w });
    });

    // Linhas
    const statusMap = { pendente: 'Pendente', em_preparacao: 'Em Preparação', em_rota: 'Em Rota', entregue: 'Entregue', cancelada: 'Cancelada' };
    rows.forEach((row, i) => {
      const y = tableTop + 22 + i * 20;
      if (y > doc.page.height - 60) {
        doc.addPage({ layout: 'landscape' });
        return;
      }
      doc.rect(40, y, doc.page.width - 80, 20).fill(i % 2 === 0 ? '#f8f9fa' : '#ffffff');
      doc.fillColor('#333333').fontSize(8).font('Helvetica');
      cols.forEach(col => {
        let val = '';
        if (col.label === 'Código') val = row.codigo;
        else if (col.label === 'Cliente') val = row.cliente_nome;
        else if (col.label === 'Destino') val = `${row.endereco_destino?.substring(0, 25) || '-'}`;
        else if (col.label === 'Status') val = statusMap[row.status] || row.status;
        else if (col.label === 'Dt. Prevista') val = row.data_prevista ? new Date(row.data_prevista).toLocaleDateString('pt-BR') : '-';
        else if (col.label === 'Motorista') val = row.motorista || '-';
        doc.text(val, col.x, y + 6, { width: col.w - 4 });
      });
    });

    // Rodapé
    doc.rect(0, doc.page.height - 30, doc.page.width, 30).fill('#1a1a2e');
    doc.fillColor('white').fontSize(8).text(`Total de registros: ${rows.length}`, 40, doc.page.height - 20);
    doc.text('LogiTrack © 2024', doc.page.width - 120, doc.page.height - 20);

    doc.end();
  } catch (error) { next(error); }
};

module.exports = { exportarEntregasExcel, exportarEntregasPDF };

import json, re, sys, xml.etree.ElementTree as ET, zipfile
from pathlib import Path

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
BORDER = {'thin': 1, 'hair': 2, 'dotted': 3, 'dashed': 4, 'dashDot': 5, 'dashDotDot': 6, 'double': 7, 'medium': 8, 'mediumDashed': 9, 'mediumDashDot': 10, 'mediumDashDotDot': 11, 'slantDashDot': 12, 'thick': 13}
H = {'left': 1, 'center': 2, 'right': 3, 'justify': 4, 'distributed': 6}
V = {'top': 1, 'center': 2, 'bottom': 3}
FORMATS = {0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 9: '0%', 10: '0.00%', 14: 'm/d/yy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss', 22: 'm/d/yy h:mm', 37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)', 49: '@'}


def text(element):
    return ''.join(element.itertext()) if element is not None else ''


def indices(reference):
    match = re.match(r'([A-Z]+)(\d+)', reference)
    column = 0
    for character in match.group(1):
        column = column * 26 + ord(character) - 64
    return int(match.group(2)) - 1, column - 1


def rgb(element, default=None):
    value = element.get('rgb') if element is not None else None
    return f'#{value[-6:]}' if value else default


def parse_styles(data):
    root = ET.fromstring(data)
    fonts = []
    for item in root.findall('m:fonts/m:font', NS):
        size = item.find('m:sz', NS)
        fonts.append({'ff': text(item.find('m:name', NS)) or 'Arial', 'fs': float(size.get('val')) if size is not None else 10, 'bl': int(item.find('m:b', NS) is not None), 'it': int(item.find('m:i', NS) is not None), 'cl': rgb(item.find('m:color', NS), '#000000')})
    fills = []
    for item in root.findall('m:fills/m:fill', NS):
        pattern = item.find('m:patternFill', NS)
        fills.append(rgb(pattern.find('m:fgColor', NS) if pattern is not None else None))
    borders = []
    for item in root.findall('m:borders/m:border', NS):
        converted = {}
        for source, target in [('top', 't'), ('right', 'r'), ('bottom', 'b'), ('left', 'l')]:
            edge = item.find(f'm:{source}', NS)
            border = edge.get('style') if edge is not None else None
            if border in BORDER:
                converted[target] = {'s': BORDER[border], 'cl': {'rgb': rgb(edge.find('m:color', NS), '#000000')}}
        borders.append(converted or None)
    formats = FORMATS.copy()
    for item in root.findall('m:numFmts/m:numFmt', NS):
        formats[int(item.get('numFmtId'))] = item.get('formatCode')
    result = {}
    for index, item in enumerate(root.findall('m:cellXfs/m:xf', NS)):
        font = fonts[int(item.get('fontId', '0'))]
        style = {key: value for key, value in font.items() if value not in (0, 10, 'Arial', '#000000')}
        if font['cl'] != '#000000': style['cl'] = {'rgb': font['cl']}
        fill = fills[int(item.get('fillId', '0'))]
        if fill: style['bg'] = {'rgb': fill}
        border = borders[int(item.get('borderId', '0'))]
        if border: style['bd'] = border
        alignment = item.find('m:alignment', NS)
        if alignment is not None:
            if alignment.get('horizontal') in H: style['ht'] = H[alignment.get('horizontal')]
            if alignment.get('vertical') in V: style['vt'] = V[alignment.get('vertical')]
            if alignment.get('wrapText') == '1': style['tb'] = 3
        format_code = formats.get(int(item.get('numFmtId', '0')))
        if format_code and format_code != 'General': style['n'] = {'pattern': format_code}
        result[f's{index}'] = style
    return result


def value(cell, strings):
    node, kind = cell.find('m:v', NS), cell.get('t')
    raw = node.text if node is not None else None
    if kind == 's' and raw is not None: return {'v': strings[int(raw)], 't': 1}
    if kind == 'inlineStr': return {'v': text(cell.find('m:is', NS)), 't': 1}
    if kind == 'b' and raw is not None: return {'v': raw == '1', 't': 3}
    if kind in {'e', 'str'}: return {'v': raw or '', 't': 1}
    if raw is None: return {}
    try:
        number = float(raw)
        return {'v': int(number) if number.is_integer() else number, 't': 2}
    except ValueError:
        return {'v': raw, 't': 1}


def build(source, destination):
    with zipfile.ZipFile(source) as book:
        style_data = parse_styles(book.read('xl/styles.xml'))
        strings = [text(item) for item in ET.fromstring(book.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        sheet = ET.fromstring(book.read('xl/worksheets/sheet1.xml'))
    end_row, end_column = indices(sheet.find('m:dimension', NS).get('ref', 'A1').split(':')[-1])
    cells, rows, columns = {}, {}, {}
    for row in sheet.findall('m:sheetData/m:row', NS):
        row_index = int(row.get('r')) - 1
        info = {}
        if row.get('ht'): info['h'] = round(float(row.get('ht')) * 4 / 3)
        if row.get('hidden') == '1': info['hd'] = 1
        if info: rows[row_index] = info
        for cell in row.findall('m:c', NS):
            cell_row, cell_column = indices(cell.get('r'))
            data = value(cell, strings)
            if cell.get('s'): data['s'] = f"s{cell.get('s')}"
            if data: cells.setdefault(cell_row, {})[cell_column] = data
    for column in sheet.findall('m:cols/m:col', NS):
        for index in range(int(column.get('min')) - 1, int(column.get('max'))):
            columns[index] = {'w': round(float(column.get('width', '8.43')) * 7 + 5), **({'hd': 1} if column.get('hidden') == '1' else {})}
    merges = []
    for item in sheet.findall('m:mergeCells/m:mergeCell', NS):
        start, end = item.get('ref').split(':')
        start_row, start_column = indices(start)
        merge_row, merge_column = indices(end)
        merges.append({'startRow': start_row, 'startColumn': start_column, 'endRow': merge_row, 'endColumn': merge_column})
    height = sheet.find('m:sheetFormatPr', NS).get('defaultRowHeight', '15')
    snapshot = {'id': 'data-2026', 'name': 'Data SROI 2026', 'appVersion': '0.25.0', 'locale': 'enUS', 'styles': style_data, 'sheetOrder': ['sheet-1'], 'sheets': {'sheet-1': {'id': 'sheet-1', 'name': 'Sheet1', 'tabColor': '', 'hidden': 0, 'freeze': {'xSplit': 0, 'ySplit': 0}, 'rowCount': end_row + 1, 'columnCount': end_column + 1, 'zoomRatio': 1, 'scrollTop': 0, 'scrollLeft': 0, 'defaultColumnWidth': 64, 'defaultRowHeight': round(float(height) * 4 / 3), 'mergeData': merges, 'cellData': cells, 'rowData': rows, 'columnData': columns, 'rowHeader': {'width': 46}, 'columnHeader': {'height': 20}, 'showGridlines': 1, 'rightToLeft': 0}}}
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')


if __name__ == '__main__':
    build(Path(sys.argv[1] if len(sys.argv) > 1 else 'data_2026.xlsx'), Path(sys.argv[2] if len(sys.argv) > 2 else 'public/data/data_2026.univer.json'))

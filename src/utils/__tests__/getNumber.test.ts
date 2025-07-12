import { getAvNumber } from '../getNumber'

describe('getNumber', () => {
  it('fC2系列', () => {
    expect(getAvNumber('FC2-PPV-123456')).toBe('FC2-PPV-123456')
    expect(getAvNumber('fc2ppv-123456')).toBe('FC2-PPV-123456')
    expect(getAvNumber('[FC2-PPV-123456]')).toBe('FC2-PPV-123456')
    expect(getAvNumber('FC2PPV-123456')).toBe('FC2-PPV-123456')
  })

  it('hEYZO系列', () => {
    expect(getAvNumber('HEYZO-1234')).toBe('HEYZO-1234')
    expect(getAvNumber('heyzo 1234')).toBe('HEYZO-1234')
    expect(getAvNumber('[HEYZO-1234]')).toBe('HEYZO-1234')
  })

  // 麻豆系列测试
  it('麻豆系列', () => {
    expect(getAvNumber('MDX-0123')).toBe('MDX-0123')
    expect(getAvNumber('MKY-NS-001')).toBe('MKY-NS-001')
    expect(getAvNumber('MD-0123')).toBe('MD-0123')
  })

  it('加勒比系列', () => {
    expect(getAvNumber('Carib-123-456')).toBe('CARIB-123-456')
    expect(getAvNumber('Caribbean-123-456')).toBe('CARIB-123-456')
    expect(getAvNumber('carib 123 456')).toBe('CARIB-123-456')
  })

  it('东京热系列', () => {
    expect(getAvNumber('Tokyo-Hot-n1234')).toBe('TOKYO-HOT-N1234')
    expect(getAvNumber('tokyo hot n1234')).toBe('TOKYO-HOT-N1234')
  })

  it('一本道系列 or Pacopacomama or 10musume系列', () => {
    expect(getAvNumber('042906_872')).toBe('042906_872')
    expect(getAvNumber('10musume-123114_01')).toBe('123114_01')
    expect(getAvNumber('10musume 123114 01')).toBe('123114_01')
    expect(getAvNumber('pacopacomama-123114_01')).toBe('123114_01')
    expect(getAvNumber('Pacopacomama 123114 01')).toBe('123114_01')
  })

  it('heydouga系列', () => {
    expect(getAvNumber('heydouga-4037-123')).toBe('4037-123')
    expect(getAvNumber('Heydouga 4037-123')).toBe('4037-123')
    expect(getAvNumber('Heydouga 4037-1234')).toBe('4037-1234')
  })

  it('标准格式', () => {
    expect(getAvNumber('GDSC-88')).toBe('GDSC-88')
    expect(getAvNumber('GMMD-02')).toBe('GMMD-02')
    expect(getAvNumber('ABC-123')).toBe('ABC-123')
    expect(getAvNumber('ABCD-12345')).toBe('ABCD-12345')
    expect(getAvNumber('abc123')).toBe('ABC-123')
    expect(getAvNumber('[ABC-123]')).toBe('ABC-123')
    expect(getAvNumber('123ABC-123')).toBe('ABC-123')
  })

  it('带有额外信息的文件名', () => {
    expect(getAvNumber('ABC-123 1080p')).toBe('ABC-123')
    expect(getAvNumber('ABC-123c.mp4')).toBe('ABC-123')
    expect(getAvNumber('ABC-123 [HD]')).toBe('ABC-123')
    expect(getAvNumber('ABC-123_HD.mp4')).toBe('ABC-123')
    expect(getAvNumber('【ABC-123】中文标题.mp4')).toBe('ABC-123')
    expect(getAvNumber('(ABC-123) [HD].mp4')).toBe('ABC-123')
    expect(getAvNumber('hjd2048.com-0629mide661-h264')).toBe('MIDE-661')
    expect(getAvNumber('[activehlj.com]@SONE-263_[4K]')).toBe('SONE-263')
    expect(getAvNumber('4k2.com@ipzz-469')).toBe('IPZZ-469')
    expect(getAvNumber('hhd800.com@ABW-304-C_X1080X')).toBe('ABW-304')
  })

  it('无效输入', () => {
    expect(getAvNumber('')).toBeNull()
    expect(getAvNumber('invalid')).toBeNull()
    expect(getAvNumber('123456')).toBeNull()
    expect(getAvNumber('abcdef')).toBeNull()
    expect(getAvNumber('www.98T.la@SyMengNan689')).toBeNull()
    expect(
      getAvNumber('www.98T.la@share_db86f06fdfbf31573ca6828ac0716d22'),
    ).toBeNull()
  })
})

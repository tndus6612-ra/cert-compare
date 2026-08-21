// 실제 사용하는 18개 국기만 개별 import — flag-icons 전체 CSS를 쓰면
// 세계 모든 국가(250개+) SVG가 다 같이 번들링되어 용량이 크게 늘어난다.
import kr from 'flag-icons/flags/4x3/kr.svg'
import jp from 'flag-icons/flags/4x3/jp.svg'
import cn from 'flag-icons/flags/4x3/cn.svg'
import inFlag from 'flag-icons/flags/4x3/in.svg'
import sg from 'flag-icons/flags/4x3/sg.svg'
import vn from 'flag-icons/flags/4x3/vn.svg'
import eu from 'flag-icons/flags/4x3/eu.svg'
import gb from 'flag-icons/flags/4x3/gb.svg'
import sa from 'flag-icons/flags/4x3/sa.svg'
import au from 'flag-icons/flags/4x3/au.svg'
import us from 'flag-icons/flags/4x3/us.svg'
import ca from 'flag-icons/flags/4x3/ca.svg'
import mx from 'flag-icons/flags/4x3/mx.svg'
import br from 'flag-icons/flags/4x3/br.svg'
import co from 'flag-icons/flags/4x3/co.svg'
import ar from 'flag-icons/flags/4x3/ar.svg'
import cl from 'flag-icons/flags/4x3/cl.svg'
import pe from 'flag-icons/flags/4x3/pe.svg'

export const FLAG_URLS = { kr, jp, cn, in: inFlag, sg, vn, eu, gb, sa, au, us, ca, mx, br, co, ar, cl, pe }

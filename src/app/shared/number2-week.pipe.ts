import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'number2Week'
})
export class Number2WeekPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    let day = 'At Birth'
    switch (value) {
        case null:
            day = '';
            break;
        case 0:
            day = 'At Birth';
            break;
        case 7:
            day = '1 Week';
            break;
        case 14:
            day = '2 Weeks';
            break;
        case 21:
            day = '3 Weeks';
            break;
        case 28:
            day = '4 Weeks';
            break;
        case 35:
            day = '5 Weeks';
            break;
        case 42:
            day = '6 Weeks';
            break;
        case 49:
            day = '7 Weeks';
            break;
        case 56:
            day = '8 Weeks';
            break;
        case 63:
            day = '9 Weeks';
            break;
        case 70:
            day = '10 Weeks';
            break;
        case 77:
            day = '11 Weeks';
            break;
        case 84:
            day = '3 Months';
            break;
        case 91:
            day = '13 Weeks';
            break;
        case 98:
            day = '14 Weeks';
            break;
        case 105:
            day = '15 Weeks';
            break;
        case 112:
            day = '16 Weeks';
            break;
        case 119:
            day = '17 Weeks';
            break;
        case 126:
            day = '18 Weeks';
            break;
        case 133:
            day = '19 Weeks';
            break;
        case 140:
            day = '20 Weeks';
            break;
        case 147:
            day = '21 Weeks';
            break;
        case 154:
            day = '22 Weeks';
            break;
        case 161:
            day = '23 Weeks';
            break;
        case 168:
            day = '6 Months';
            break;
        case 212:
            day = '7 Months';
            break;
        case 243:
            day = '8 Months';
            break;
        case 274:
            day = '9 Months';
            break;
        case 304:
            day = '10 Months';
            break;
        case 334:
            day = '11 Months';
            break;
        case 365:
            day = '1 Year';
            break;
        case 395:
            day = '13 Months';
            break;
        case 426:
            day = '14 Months';
            break;
        case 456:
            day = '15 Months';
            break;
        case 486:
            day = '16 Months';
            break;
        case 517:
            day = '17 Months';
            break;
        case 547:
            day = '18 Months';
            break;
        case 578:
            day = '19 Months';
            break;
        case 608:
            day = '20 Months';
            break;
        case 639:
            day = '21 Months';
            break;
        case 669:
            day = '22 Months';
            break;
        case 699:
            day = '23 Months';
            break;
        case 730:
            day = '2 Years';
            break;
        case 760:
            day = '25 Months';
            break;
        case 791:
            day = '26 Months';
            break;
        case 821:
            day = '27 Months';
            break;
        case 851:
            day = '28 Months';
            break;
        case 882:
            day = '29 Months';
            break;
        case 912:
            day = '30 Months';
            break;
        case 943:
            day = '31 Months';
            break;
        case 973:
            day = '32 Months';
            break;
        case 1004:
            day = '33 Months';
            break;
        case 1034:
            day = '34 Months';
            break;
        case 1064:
            day = '35 Months';
            break;
        case 1095:
            day = '3 Years';
            break;
        case 1125:
            day = '37 Months';
            break;
        case 1156:
            day = '38 Months';
            break;
        case 1186:
            day = '39 Months';
            break;
        case 1216:
            day = '40 Months';
            break;
        case 1247:
            day = '41 Months';
            break;
        case 1277:
            day = '42 Months';
            break;
        case 1308:
            day = '43 Months';
            break;
        case 1338:
            day = '44 Months';
            break;
        case 1369:
            day = '45 Months';
            break;
        case 1399:
            day = '46 Months';
            break;
        case 1429:
            day = '47 Months';
            break;
        case 1460:
            day = '4 Years';
            break;
        case 1490:
            day = '49 Months';
            break;
        case 1521:
            day = '50 Months';
            break;
        case 1551:
            day = '51 Months';
            break;
        case 1582:
            day = '52 Months';
            break;
        case 1612:
            day = '53 Months';
            break;
        case 1642:
            day = '54 Months';
            break;
        case 1673:
            day = '55 Months';
            break;
        case 1703:
            day = '56 Months';
            break;
        case 1734:
            day = '57 Months';
            break;
        case 1764:
            day = '58 Months';
            break;
        case 1795:
            day = '59 Months';
            break;
        case 1825:
            day = '5 Years';
            break;
        case 2190:
            day = '6 Years';
            break;
        case 2555:
            day = '7 Years';
            break;
        case 2920:
            day = '8 Years';
            break;
        case 3285:
            day = '9 Years';
            break;
        case 3315:
            day = '9 Year 1 Month';
            break;
        case 3650:
            day = '10 Years';
            break;
        case 3833:
            day = '10 Year 6 Months';
            break;

        case 4015:
            day = '11 Years';
            break;
        case 4380:
            day = '12 Years';
            break;
        case 4745:
            day = '13 Years';
            break;
        case 5110:
            day = '14 Years';
            break;
        case 5475:
            day = '15 Years';
            break;
        case 5840:
            day = '16 Years';
            break;
        case 6205:
            day = '17 Years';
            break;
        case 6570:
            day = '18 Years';
            break;
    }
    return day;
  }
}
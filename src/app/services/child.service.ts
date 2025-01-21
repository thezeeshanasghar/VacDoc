import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class ChildService extends BaseService {
  add: any;
  checkIfMobileExist(MobileNumber: any) {
    throw new Error("Method not implemented.");
  }
  private readonly API_CHILD = `${environment.BASE_URL}`
  constructor(
    protected http: HttpClient
  ) { super(http); }

  getChild(Id: String, value): Observable<any> {
    const url = `${this.API_CHILD}doctor/${Id}/20/${value}/childs?searchKeyword=`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getChildByClinic(Id: String , page: number): Observable<any> {
    const url = `${this.API_CHILD}child/clinic/${Id}/${page}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  getChildById(Id: String): Observable<any> {
    const url = `${this.API_CHILD}child/${Id}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  addChild(data): Observable<any> {
    const url = `${this.API_CHILD}child`;
    return this.http.post(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  editChild(data): Observable<any> {
    const url = `${this.API_CHILD}child/`;
    return this.http.put(url, data, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteChild(id: string): Observable<any> {
    const url = `${this.API_CHILD}child/${id}`;
    return this.http.delete(url, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  getChildByUserSearch(docId , page, value): Observable<any> {
    const url = `${this.API_CHILD}doctor/${docId}/${page}/childs?searchKeyword=${value}`;
    return this.http.get(url, this.httpOptions).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }
  toggleChildActiveStatus(childId: number): Observable<any> {
    const apiUrl = `${this.API_CHILD}child/${childId}/toggle-active`;
    return this.http.put<any>(apiUrl, {}, this.httpOptions).pipe(
      catchError(this.handleError)
    );
  }

  downloadPdf(childId: number) {
    debugger
    const apiUrl = `${this.API_CHILD}Child/PID/${childId}`;
    return this.http.get(apiUrl, { responseType: 'blob' });
  }

  // othercity = false;
  // cities=["Abbottabad",
  // "Adezai",
  // "Ali Bandar",
  // "Amir Chah",
  // "Attock",
  // "Ayubia",
  // "Bahawalpur",
  // "Baden",
  // "Bagh",
  // "Bahawalnagar",
  // "Burewala",
  // "Banda Daud Shah",
  // "Bannu district|Bannu",
  // "Batagram",
  // "Bazdar",
  // "Bela",
  // "Bellpat",
  // "Bhag",
  // "Bhakkar",
  // "Bhalwal",
  // "Bhimber",
  // "Birote",
  // "Buner",
  // "Burj",
  // "Chiniot",
  // "Chachro",
  // "Chagai",
  // "Chah Sandan",
  // "Chailianwala",
  // "Chakdara",
  // "Chakku",
  // "Chakwal",
  // "Chaman",
  // "Charsadda",
  // "Chhatr",
  // "Chichawatni",
  // "Chitral",
  // "Dadu",
  // "Dera Ghazi Khan",
  // "Dera Ismail Khan",
  //  "Dalbandin",
  // "Dargai",
  // "Darya Khan",
  // "Daska",
  // "Dera Bugti",
  // "Dhana Sar",
  // "Digri",
  // "Dina City|Dina",
  // "Dinga",
  // ", Pakistan|Diplo",
  // "Diwana",
  // "Dokri",
  // "Drosh",
  // "Duki",
  // "Dushi",
  // "Duzab",
  // "Faisalabad",
  // "Fateh Jang",
  // "Ghotki",
  // "Gwadar",
  // "Gujranwala",
  // "Gujrat",
  // "Gadra",
  // "Gajar",
  // "Gandava",
  // "Garhi Khairo",
  // "Garruck",
  // "Ghakhar Mandi",
  // "Ghanian",
  // "Ghauspur",
  // "Ghazluna",
  // "Girdan",
  // "Gulistan",
  // "Gwash",
  // "Hyderabad",
  // "Hala",
  // "Haripur",
  // "Hab Chauki",
  // "Hafizabad",
  // "Hameedabad",
  // "Hangu",
  // "Harnai",
  // "Hasilpur",
  // "Haveli Lakha",
  // "Hinglaj",
  // "Hoshab",
  // "Islamabad",
  // "Islamkot",
  // "Ispikan",
  // "Jacobabad",
  // "Jamshoro",
  // "Jhang",
  // "Jhelum",
  // "Jamesabad",
  // "Jampur",
  // "Janghar",
  // "Jati(Mughalbhin)",
  // "Jauharabad",
  // "Jhal",
  // "Jhal Jhao",
  // "Jhatpat",
  // "Jhudo",
  // "Jiwani",
  // "Jungshahi",
  // "Karachi",
  // "Kotri",
  // "Kalam",
  // "Kalandi",
  // "Kalat",
  // "Kamalia",
  // "Kamararod",
  // "Kamber",
  // "Kamokey",
  // "Kanak",
  // "Kandi",
  // "Kandiaro",
  // "Kanpur",
  // "Kapip",
  // "Kappar",
  // "Karak City",
  // "Karodi",
  // "Kashmor",
  // "Kasur",
  // "Katuri",
  // "Keti Bandar",
  // "Khairpur",
  // "Khanaspur",
  // "Khanewal",
  // "Kharan",
  // "kharian",
  // "Khokhropur",
  // "Khora",
  // "Khushab",
  // "Khuzdar",
  // "Kikki",
  // "Klupro",
  // "Kohan",
  // "Kohat",
  // "Kohistan",
  // "Kohlu",
  // "Korak",
  // "Korangi",
  // "Kot Sarae",
  // "Kotli",
  // "Lahore",
  // "Larkana",
  // "Lahri",
  // "Lakki Marwat",
  // "Lasbela",
  // "Latamber",
  // "Layyah",
  // "Leiah",
  // "Liari",
  // "Lodhran",
  // "Loralai",
  // "Lower Dir",
  // "Shadan Lund",
  // "Multan",
  // "Mandi Bahauddin",
  // "Mansehra",
  // "Mian Chanu",
  // "Mirpur",
  // "Moro",
  // "Mardan",
  // "Mach",
  // "Madyan",
  // "Malakand",
  // "Mand",
  // "Manguchar",
  // "Mashki Chah",
  // "Maslti",
  // "Mastuj",
  // "Mastung",
  // "Mathi",
  // "Matiari",
  // "Mehar",
  // "Mekhtar",
  // "Merui",
  // "Mianwali",
  // "Mianez",
  // "Mirpur Batoro",
  // "Mirpur Khas",
  // "Mirpur Sakro",
  // "Mithi",
  // "Mongora",
  // "Murgha Kibzai",
  // "Muridke",
  // "Musa Khel Bazar",
  // "Muzaffar Garh",
  // "Muzaffarabad",
  // "Nawabshah",
  // "Nazimabad",
  // "Nowshera",
  // "Nagar Parkar",
  // "Nagha Kalat",
  // "Nal",
  // "Naokot",
  // "Nasirabad",
  // "Nauroz Kalat",
  // "Naushara",
  // "Nur Gamma",
  // "Nushki",
  // "Nuttal",
  // "Okara",
  // "Ormara",
  // "Peshawar",
  // "Panjgur",
  // "Pasni City",
  // "Paharpur",
  // "Palantuk",
  // "Pendoo",
  // "Piharak",
  // "Pirmahal",
  // "Pishin",
  // "Plandri",
  // "Pokran",
  // "Pounch",
  // "Quetta",
  // "Qambar",
  // "Qamruddin Karez",
  // "Qazi Ahmad",
  // "Qila Abdullah",
  // "Qila Ladgasht",
  // "Qila Safed",
  // "Qila Saifullah",
  // "Rawalpindi",
  // "Rabwah",
  // "Rahim Yar Khan",
  // "Rajan Pur",
  // "Rakhni",
  // "Ranipur",
  // "Ratodero",
  // "Rawalakot",
  // "Renala Khurd",
  // "Robat Thana",
  // "Rodkhan",
  // "Rohri",
  // "Sialkot",
  // "Sadiqabad",
  // "Safdar Abad- (Dhaban Singh)",
  // "Sahiwal",
  // "Saidu Sharif",
  // "Saindak",
  // "Sakrand",
  // "Sanjawi",
  // "Sargodha",
  // "Saruna",
  // "Shabaz Kalat",
  // "Shadadkhot",
  // "Shahbandar",
  // "Shahpur",
  // "Shahpur Chakar",
  // "Shakargarh",
  // "Shangla",
  // "Sharam Jogizai",
  // "Sheikhupura",
  // "Shikarpur",
  // "Shingar",
  // "Shorap",
  // "Sibi",
  // "Sohawa",
  // "Sonmiani",
  // "Sooianwala",
  // "Spezand",
  // "Spintangi",
  // "Sui",
  // "Sujawal",
  // "Sukkur",
  // "Suntsar",
  // "Surab",
  // "Swabi",
  // "Swat",
  // "Tando Adam",
  // "Tando Bago",
  // "Tangi",
  // "Tank City",
  // "Tar Ahamd Rind",
  // "Thalo",
  // "Thatta",
  // "Toba Tek Singh",
  // "Tordher",
  // "Tujal",
  // "Tump",
  // "Turbat",
  // "Umarao",
  // "Umarkot",
  // "Upper Dir",
  // "Uthal",
  // "Vehari",
  // "Veirwaro",
  // "Vitakri",
  // "Wadh",
  // "Wah Cantt",
  // "Warah",
  // "Washap",
  // "Wasjuk",
  // "Wazirabad",
  // "Yakmach",
  // "Zhob",
  // "Other"]

}
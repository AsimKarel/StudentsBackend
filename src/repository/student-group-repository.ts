import { getRepository } from "typeorm"
import { GroupStudent } from "../entity/group-student.entity";
import { Group } from "../entity/group.entity"
import { Roll } from "../entity/roll.entity";
import { StudentRollState } from "../entity/student-roll-state.entity";
import { Student } from "../entity/student.entity"

export class StudentGroupRepository{
    private studentRepository = getRepository(Student)
    private groupStudentRepository = getRepository(GroupStudent)
  
  constructor(){

  }
  public async getFilteredData(number_of_weeks, roll_states, incidents, ltmt){
    
    let rolls = roll_states.split(",")
    let roll_querystring = "";
    for(let roll of rolls){
        roll_querystring += " OR RS.state = '"+roll+"'";
    }
    roll_querystring = roll_querystring.substring(3)
    

    // var now = new Date();
    // var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // var lastSunday = new Date(today.setDate(today.getDate()-today.getDay()));

    let ltmt_querystring = '';
    if(ltmt === '<')
        ltmt_querystring = 'COUNT(student.id) < ?;'
    else
        ltmt_querystring = 'COUNT(student.id) > ?;'


    let date_number_of_weeks_ago = new Date(new Date().getTime()-1000 * 60 * 60 * 24 * 7 * number_of_weeks);

    try{
    let record = await this.studentRepository.query(`SELECT student.first_name,
        COUNT(student.id) as incident_count, student.id 
        FROM Student student
        LEFT JOIN student_roll_state RS on student.id=RS.student_id
        LEFT JOIN roll r on r.id = RS.roll_id where`
        +roll_querystring+
        `AND r.completed_at > ?
        GROUP BY student.id
        HAVING `
            +ltmt_querystring,[date_number_of_weeks_ago,incidents]);

        return record;
    }
    catch(e){
        console.log(e)
    }
        
        
  }

  public async getGroupStudents(group_id){
    let records = await this.studentRepository.createQueryBuilder()
    .select()
    .leftJoin(GroupStudent,"GS","GS.student_id = student.id")
    .where("GS.group_id = :group_id", {group_id})
    .getMany()
    return records
  }
}

// try{
//     let record = await this.groupRepository.createQueryBuilder()
//     .select()
//     .leftJoin(StudentRollState, "RS", "student.id=RS.student_id")
//     .leftJoin(Roll, "r", "r.id = RS.roll_id")
//     .where("RS.state = :roll_state", {roll_states})
//     .andWhere("r.completed_at < :date",{date})
//     .groupBy("student.id")
//     .having("COUNT(student.id) < :incident",{incidents})
//     .getMany()
//     console.log(record)
// }
// catch(e){
//     console.log(e)
// }
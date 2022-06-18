import { getRepository } from "typeorm"
import { NextFunction, Request, Response } from "express"
import { Group } from "../entity/group.entity"
import { CreateGroupInput, UpdateGroupInput } from "../interface/group.interface"
import { StudentGroupRepository } from "../repository/student-group-repository"
import { GroupStudent } from "../entity/group-student.entity"
import { Student } from "../entity/student.entity"


export class GroupController {
  private groupRepository = getRepository(Group)
  private groupStudentRepository = getRepository(GroupStudent)
  private studentGroupRepository = new StudentGroupRepository()
  async allGroups(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    return this.groupRepository.find()
    // Return the list of all groups
  }

  async createGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    const { body: params } = request

    const createGroupInput: CreateGroupInput = {
      name: params.name,
      number_of_weeks: params.number_of_weeks,
      roll_states: params.roll_states,
      incidents: params.incidents,
      ltmt: params.ltmt,
      run_at: new Date(),
      student_count: 0
    }
    const group = new Group()
    group.prepareToCreate(createGroupInput)

    return this.groupRepository.save(group)
    // Add a Group
  }

  async updateGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:

    // Update a Group
    const { body: params } = request

    this.groupRepository.findOne(params.id).then((groupState) => {
      const updateGroupInput: UpdateGroupInput = {
        id: params.id,
        name: params.name,
        number_of_weeks: params.number_of_weeks,
        roll_states: params.roll_states,
        incidents: params.incidents,
        ltmt: params.ltmt,
      }
      groupState.prepareToUpdate(updateGroupInput)
      console.log(updateGroupInput)
      return this.groupRepository.save(groupState)
    })
  }

  async removeGroup(request: Request, response: Response, next: NextFunction) {
    // Task 1:
    const { body: params } = request
    let groupToRemove = await this.groupRepository.findOne(params.id)
    await this.groupStudentRepository.delete({ group_id: params.id });
    await this.groupRepository.delete({ id: params.id })
    return "Deleted"
    // Delete a Group
  }

  async getGroupStudents(request: Request, response: Response, next: NextFunction) {
    // Task 1:

    let students = await this.studentGroupRepository.getGroupStudents(request.param('groupId')) ;
    for(let student of students){
      student.full_name = student.first_name + " " + student.last_name
    }

    return students
    // Return the list of Students that are in a Group
  }


  async runGroupFilters(request: Request, response: Response, next: NextFunction) {
    // Task 2:

    //get all the groups from DB
    let groups = await this.groupRepository.find();
    for(let group of groups){
      //For each group, query the student rolls to see which students match the filter for the group
      let groupData = await this.studentGroupRepository.getFilteredData(group.number_of_weeks, group.roll_states, group.incidents, group.ltmt);

      // Clear out the groups (delete all the students from the groups)
      this.groupStudentRepository.delete({ group_id: group.id });

      //Create GroupStudent object
      for(let row of groupData){
        let grpS = new GroupStudent()
        grpS.group_id = group.id
        grpS.incident_count = row["incident_count"]
        grpS.student_id = row["id"]
        this.groupStudentRepository.save(grpS)
      }
      //update the group object in DB
      group.run_at = new Date();
      group.student_count = groupData.length
      this.groupRepository.save(group);

    }
    return groups

  }
}
